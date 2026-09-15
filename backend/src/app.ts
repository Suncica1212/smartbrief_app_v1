import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { submissionRoutes } from "./routes/submissions.js";

export async function buildApp() {
  const app = Fastify({
    trustProxy: config.TRUST_PROXY,
    logger: { level: config.LOG_LEVEL, redact: ["req.headers.authorization", "req.body", "res.headers.set-cookie"] },
    bodyLimit: 1_048_576,
    requestIdHeader: "x-request-id"
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origin not allowed"), false);
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization", "x-request-id"],
    maxAge: 86400
  });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(multipart, { limits: { files: 1, fileSize: config.MAX_FILE_BYTES, fields: 4, parts: 5 } });
  await app.register(healthRoutes);
  await app.register(submissionRoutes);
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error }, "request failed");
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : 500;
    reply.code(Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500 ? statusCode : 500)
      .send({ error: "REQUEST_FAILED", requestId: request.id });
  });
  return app;
}
