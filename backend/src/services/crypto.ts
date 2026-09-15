import { createCipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export type EncryptedValue = { ciphertext: Buffer; nonce: Buffer; tag: Buffer };

export function encrypt(value: unknown): EncryptedValue {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", config.encryptionKey, nonce);
  const plaintext = Buffer.from(typeof value === "string" ? value : JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, nonce, tag: cipher.getAuthTag() };
}

export function hashToken(token: string): Buffer {
  return createHash("sha256").update(config.TOKEN_PEPPER).update("\0").update(token).digest();
}

export function tokenMatches(token: string, expected: Buffer): boolean {
  const actual = hashToken(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
