import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";

export const storage = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  forcePathStyle: config.S3_FORCE_PATH_STYLE,
  credentials: { accessKeyId: config.S3_ACCESS_KEY, secretAccessKey: config.S3_SECRET_KEY }
});

export async function assertStorageReady(): Promise<void> {
  await storage.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
}

export async function putPrivateObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await storage.send(new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
    CacheControl: "private, no-store",
    Metadata: { "smartbrief-data-class": "confidential-project-file" }
  }));
}

export async function deletePrivateObject(key: string): Promise<void> {
  await storage.send(new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }));
}
