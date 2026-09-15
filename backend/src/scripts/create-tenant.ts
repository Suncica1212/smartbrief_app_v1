import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const [name, email, origin, retentionText = "90"] = process.argv.slice(2);
const retention = Number(retentionText);
if (!name || !email || !origin || ![30, 90, 180].includes(retention)) {
  console.error("Usage: npm run tenant:create -- <name> <notification-email> <https-origin> [30|90|180]");
  process.exit(1);
}
const id = randomUUID();
const publicKey = randomUUID();
await db.execute(
  "INSERT INTO tenants(id,name,public_key,notification_email,retention_days,allowed_origins) VALUES (?,?,?,?,?,?)",
  [id, name, publicKey, email, retention, JSON.stringify([origin])]
);
console.log(JSON.stringify({ tenantId: id, tenantKey: publicKey, retentionDays: retention }, null, 2));
await db.end();
