import type { RowDataPacket } from "mysql2/promise";
import type { FastifyBaseLogger } from "fastify";
import { config } from "../config.js";
import { db, transaction } from "../db.js";
import { deletePrivateObject } from "../services/storage.js";

type ExpiredRow = RowDataPacket & { id: string };
type FileRow = RowDataPacket & { object_key: string };

export async function deleteExpiredSubmissions(log: FastifyBaseLogger): Promise<number> {
  const [expired] = await db.execute<ExpiredRow[]>(
    "SELECT id FROM submissions WHERE expires_at<=UTC_TIMESTAMP(3) ORDER BY expires_at LIMIT ?",
    [config.DELETE_BATCH_SIZE]
  );
  let deleted = 0;
  for (const candidate of expired) {
    try {
      await transaction(async (connection) => {
        const [locked] = await connection.execute<ExpiredRow[]>(
          "SELECT id FROM submissions WHERE id=? AND expires_at<=UTC_TIMESTAMP(3) FOR UPDATE", [candidate.id]
        );
        if (!locked[0]) return;
        await connection.execute("UPDATE submissions SET status='deleting' WHERE id=?", [candidate.id]);
        const [files] = await connection.execute<FileRow[]>("SELECT object_key FROM submission_files WHERE submission_id=?", [candidate.id]);
        for (const file of files) await deletePrivateObject(file.object_key);
        await connection.execute("DELETE FROM submissions WHERE id=?", [candidate.id]);
        deleted += 1;
      });
    } catch (error) {
      log.error({ submissionId: candidate.id, error }, "automatic deletion failed; it will be retried");
    }
  }
  return deleted;
}

export function startCleanupJob(log: FastifyBaseLogger): NodeJS.Timeout {
  const run = () => deleteExpiredSubmissions(log).then((count) => {
    if (count) log.info({ count }, "expired submissions deleted");
  }).catch((error) => log.error({ error }, "cleanup job failed"));
  void run();
  const timer = setInterval(run, config.DELETE_INTERVAL_MINUTES * 60_000);
  timer.unref();
  return timer;
}
