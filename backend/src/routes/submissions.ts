import { randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { config } from "../config.js";
import { db, transaction } from "../db.js";
import { submissionSchema, uploadFieldsSchema } from "../schema.js";
import { encrypt, hashToken } from "../services/crypto.js";
import { prepareFile } from "../services/files.js";
import { deletePrivateObject, putPrivateObject } from "../services/storage.js";

type TenantRow = RowDataPacket & { id: string; retention_days: number; allowed_origins: string | string[] };
type SubmissionRow = RowDataPacket & { id: string; tenant_id: string; status: string; access_token_hash: Buffer; total_file_bytes: number };

function bearer(request: FastifyRequest): string {
  const value = request.headers.authorization;
  if (!value?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  return value.slice(7);
}

async function lockedSubmission(connection: PoolConnection, id: string, token: string): Promise<SubmissionRow> {
  const tokenHash = hashToken(token);
  const [rows] = await connection.execute<SubmissionRow[]>(
    "SELECT id, tenant_id, status, access_token_hash, total_file_bytes FROM submissions WHERE id=? AND access_token_hash=? FOR UPDATE",
    [id, tokenHash]
  );
  if (!rows[0]) throw new Error("UNAUTHORIZED");
  return rows[0];
}

function referenceCode(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SB-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function multipartValue(field: unknown): unknown {
  if (!field || Array.isArray(field) || typeof field !== "object" || !("value" in field)) return undefined;
  return (field as { value: unknown }).value;
}

export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/submissions", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const parsed = submissionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "INVALID_SUBMISSION", details: parsed.error.flatten() });

    const origin = request.headers.origin;
    const [tenants] = await db.execute<TenantRow[]>(
      "SELECT id, retention_days, allowed_origins FROM tenants WHERE public_key=? AND active=TRUE LIMIT 1",
      [parsed.data.tenantKey]
    );
    const tenant = tenants[0];
    if (!tenant) return reply.code(404).send({ error: "TENANT_NOT_FOUND" });
    const allowedOrigins = typeof tenant.allowed_origins === "string" ? JSON.parse(tenant.allowed_origins) : tenant.allowed_origins;
    if (origin && !allowedOrigins.includes(origin)) return reply.code(403).send({ error: "ORIGIN_NOT_ALLOWED" });

    const id = randomUUID();
    const token = randomBytes(32).toString("base64url");
    const secured = encrypt(parsed.data.payload);
    const expiresAt = new Date(Date.now() + tenant.retention_days * 86_400_000);
    const reference = referenceCode();
    await db.execute(
      `INSERT INTO submissions
       (id, tenant_id, reference_code, access_token_hash, payload_ciphertext, payload_nonce, payload_tag,
        encryption_key_version, privacy_accepted_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), ?)`,
      [id, tenant.id, reference, hashToken(token), secured.ciphertext, secured.nonce, secured.tag, config.APP_ENCRYPTION_KEY_VERSION, expiresAt]
    );
    return reply.code(201).send({ submissionId: id, reference, uploadToken: token, expiresAt: expiresAt.toISOString() });
  });

  app.post("/api/v1/submissions/:id/files", { config: { rateLimit: { max: 60, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "INVALID_ID" });
    let token: string;
    try { token = bearer(request); } catch { return reply.code(401).send({ error: "UNAUTHORIZED" }); }

    const part = await request.file({ limits: { fileSize: config.MAX_FILE_BYTES, files: 1, fields: 4 } });
    if (!part) return reply.code(400).send({ error: "FILE_REQUIRED" });
    const fields = uploadFieldsSchema.safeParse({
      area: multipartValue(part.fields.area),
      uploadSlot: multipartValue(part.fields.uploadSlot)
    });
    if (!fields.success) return reply.code(400).send({ error: "INVALID_FILE_METADATA" });

    try {
      const input = await part.toBuffer();
      const prepared = await prepareFile(input);
      const fileId = randomUUID();
      const originalName = encrypt(part.filename || "datei");
      let objectKey = "";

      await transaction(async (connection) => {
        const submission = await lockedSubmission(connection, id, token);
        if (submission.status !== "draft") throw new Error("SUBMISSION_NOT_EDITABLE");
        if (Number(submission.total_file_bytes) + prepared.body.length > config.MAX_PROJECT_BYTES) throw new Error("PROJECT_TOO_LARGE");
        objectKey = `${submission.tenant_id}/${id}/${fileId}.${prepared.extension}`;
        await putPrivateObject(objectKey, prepared.body, prepared.mimeType);
        try {
          await connection.execute(
            `INSERT INTO submission_files
             (id, submission_id, object_key, area, upload_slot, original_name_ciphertext, original_name_nonce,
              original_name_tag, mime_type, size_bytes, sha256)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [fileId, id, objectKey, fields.data.area, fields.data.uploadSlot, originalName.ciphertext, originalName.nonce,
             originalName.tag, prepared.mimeType, prepared.body.length, prepared.sha256]
          );
          await connection.execute("UPDATE submissions SET total_file_bytes=total_file_bytes+? WHERE id=?", [prepared.body.length, id]);
        } catch (error) {
          await deletePrivateObject(objectKey).catch(() => undefined);
          throw error;
        }
      });
      return reply.code(201).send({ fileId, area: fields.data.area, uploadSlot: fields.data.uploadSlot, mimeType: prepared.mimeType, size: prepared.body.length });
    } catch (error) {
      const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
      const status = code === "UNAUTHORIZED" ? 401 : code === "PROJECT_TOO_LARGE" ? 413 : code.includes("LARGE") ? 413 : 400;
      return reply.code(status).send({ error: code });
    }
  });

  app.delete("/api/v1/submissions/:id/files/:fileId", async (request, reply) => {
    const { id, fileId } = request.params as { id: string; fileId: string };
    let token: string;
    try { token = bearer(request); } catch { return reply.code(401).send({ error: "UNAUTHORIZED" }); }
    try {
      await transaction(async (connection) => {
        const submission = await lockedSubmission(connection, id, token);
        if (submission.status !== "draft") throw new Error("SUBMISSION_NOT_EDITABLE");
        const [rows] = await connection.execute<(RowDataPacket & { object_key: string; size_bytes: number })[]>(
          "SELECT object_key, size_bytes FROM submission_files WHERE id=? AND submission_id=? FOR UPDATE", [fileId, id]
        );
        const file = rows[0];
        if (!file) throw new Error("FILE_NOT_FOUND");
        await deletePrivateObject(file.object_key);
        await connection.execute("DELETE FROM submission_files WHERE id=?", [fileId]);
        await connection.execute("UPDATE submissions SET total_file_bytes=GREATEST(0,total_file_bytes-?) WHERE id=?", [file.size_bytes, id]);
      });
      return reply.code(204).send();
    } catch (error) {
      const code = error instanceof Error ? error.message : "DELETE_FAILED";
      return reply.code(code === "UNAUTHORIZED" ? 401 : code === "FILE_NOT_FOUND" ? 404 : 409).send({ error: code });
    }
  });

  app.post("/api/v1/submissions/:id/submit", async (request, reply) => {
    const { id } = request.params as { id: string };
    let token: string;
    try { token = bearer(request); } catch { return reply.code(401).send({ error: "UNAUTHORIZED" }); }
    try {
      const result = await transaction(async (connection) => {
        const submission = await lockedSubmission(connection, id, token);
        if (submission.status !== "draft") throw new Error("SUBMISSION_NOT_EDITABLE");
        await connection.execute("UPDATE submissions SET status='submitted', submitted_at=UTC_TIMESTAMP(3) WHERE id=?", [id]);
        const [rows] = await connection.execute<(RowDataPacket & { reference_code: string; expires_at: Date })[]>(
          "SELECT reference_code, expires_at FROM submissions WHERE id=?", [id]
        );
        return rows[0];
      });
      return reply.send({ ok: true, reference: result?.reference_code, expiresAt: result?.expires_at });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SUBMIT_FAILED";
      return reply.code(code === "UNAUTHORIZED" ? 401 : 409).send({ error: code });
    }
  });
}
