import { z } from "zod";

// The title the upload dialog sends to the `video` upload route.
export const UploadVideoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(120, "Use 120 characters or fewer."),
});

export type UploadVideoInput = z.infer<typeof UploadVideoSchema>;
