import { z } from "zod";

export const CompleteVideoUploadSchema = z.object({
  videoId: z.string().min(1),
  posterKey: z.string().min(1).max(500).optional(),
});

export type CompleteVideoUploadInput = z.infer<
  typeof CompleteVideoUploadSchema
>;
