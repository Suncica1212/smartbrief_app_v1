import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { config } from "../config.js";

const allowedDocuments = new Set(["application/pdf"]);
const allowedImages = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PreparedFile = { body: Buffer; mimeType: string; extension: string; sha256: Buffer };

export async function prepareFile(input: Buffer): Promise<PreparedFile> {
  if (input.length > config.MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  const detected = await fileTypeFromBuffer(input);
  if (!detected) throw new Error("UNSUPPORTED_FILE_TYPE");

  let body = input;
  let mimeType = detected.mime;
  let extension = detected.ext;

  if (allowedImages.has(mimeType)) {
    if (input.length > config.MAX_IMAGE_INPUT_BYTES) throw new Error("IMAGE_TOO_LARGE");
    body = await sharp(input, { failOn: "warning", limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: config.IMAGE_MAX_EDGE, height: config.IMAGE_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: config.IMAGE_QUALITY, mozjpeg: true })
      .toBuffer();
    mimeType = "image/jpeg";
    extension = "jpg";
    if (body.length > config.MAX_OPTIMIZED_IMAGE_BYTES) throw new Error("OPTIMIZED_IMAGE_TOO_LARGE");
  } else if (!allowedDocuments.has(mimeType)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  return { body, mimeType, extension, sha256: createHash("sha256").update(body).digest() };
}
