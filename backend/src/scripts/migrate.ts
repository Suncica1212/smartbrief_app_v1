import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db } from "../db.js";

const migrationDir = resolve(process.cwd(), "migrations");
await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB`);

for (const name of (await readdir(migrationDir)).filter((v) => v.endsWith(".sql")).sort()) {
  const [rows] = await db.execute<any[]>("SELECT version FROM schema_migrations WHERE version=?", [name]);
  if (rows[0]) continue;
  const sql = await readFile(resolve(migrationDir, name), "utf8");
  const connection = await db.getConnection();
  try {
    for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((v) => v.trim()).filter(Boolean)) await connection.query(statement);
    await connection.execute("INSERT IGNORE INTO schema_migrations(version) VALUES (?)", [name]);
    console.log(`Applied ${name}`);
  } finally {
    connection.release();
  }
}
await db.end();
