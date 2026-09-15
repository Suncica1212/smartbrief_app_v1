import { z } from "zod";

const contact = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320)
}).passthrough();

export const submissionSchema = z.object({
  tenantKey: z.string().uuid(),
  privacyAccepted: z.literal(true),
  payload: z.object({
    project: z.object({ requestId: z.string().max(100).optional() }).passthrough(),
    areas: z.record(z.string(), z.unknown()),
    contact
  }).passthrough()
});

export const uploadFieldsSchema = z.object({
  area: z.string().trim().min(1).max(80),
  uploadSlot: z.string().trim().min(1).max(160)
});
