import { buildApp } from "./app.js";
import { config } from "./config.js";
import { db } from "./db.js";
import { startCleanupJob } from "./jobs/cleanup.js";

const app = await buildApp();
const cleanupTimer = startCleanupJob(app.log);

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  clearInterval(cleanupTimer);
  await app.close();
  await db.end();
  process.exit(0);
}
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

await app.listen({ host: config.HOST, port: config.PORT });
