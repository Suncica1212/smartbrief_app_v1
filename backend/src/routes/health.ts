import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { assertStorageReady } from "../services/storage.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health/live", async () => ({ ok: true }));
  app.get("/health/ready", async (_request, reply) => {
    try {
      await Promise.all([db.query("SELECT 1"), assertStorageReady()]);
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });
}
