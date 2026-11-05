import { z } from "zod";

export const UpdateVideoAnnotationsOpenSchema = z.object({
  videoId: z.string().min(1),
  open: z.boolean(),
});

export type UpdateVideoAnnotationsOpenInput = z.infer<
  typeof UpdateVideoAnnotationsOpenSchema
>;
