import "dotenv/config";
import { z } from "zod";

const bool = z.enum(["true", "false"]).transform((value) => value === "true");
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.string().default("info"),
  TRUST_PROXY: bool.default(false),
  CORS_ORIGINS: z.string().min(1),
  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.coerce.number().int().default(3306),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(12),
  MYSQL_SSL: bool.default(true),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(3),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: bool.default(false),
  APP_ENCRYPTION_KEY_BASE64: z.string().min(43),
  APP_ENCRYPTION_KEY_VERSION: z.coerce.number().int().positive().default(1),
  TOKEN_PEPPER: z.string().min(32),
  MAX_IMAGE_INPUT_BYTES: z.coerce.number().int().positive().default(26_214_400),
  MAX_OPTIMIZED_IMAGE_BYTES: z.coerce.number().int().positive().default(12_582_912),
  MAX_FILE_BYTES: z.coerce.number().int().positive().default(52_428_800),
  MAX_PROJECT_BYTES: z.coerce.number().int().positive().default(157_286_400),
  IMAGE_MAX_EDGE: z.coerce.number().int().positive().default(5000),
  IMAGE_QUALITY: z.coerce.number().int().min(40).max(100).default(88),
  DEFAULT_RETENTION_DAYS: z.coerce.number().int().default(90),
  DELETE_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  DELETE_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(15)
});

const parsed = schema.parse(process.env);
const encryptionKey = Buffer.from(parsed.APP_ENCRYPTION_KEY_BASE64, "base64");
if (encryptionKey.length !== 32) throw new Error("APP_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes");
if (![30, 90, 180].includes(parsed.DEFAULT_RETENTION_DAYS)) throw new Error("DEFAULT_RETENTION_DAYS must be 30, 90 or 180");

export const config = {
  ...parsed,
  encryptionKey,
  corsOrigins: parsed.CORS_ORIGINS.split(",").map((v) => v.trim()).filter(Boolean)
};
