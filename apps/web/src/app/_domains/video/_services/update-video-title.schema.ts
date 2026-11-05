import { z } from "zod";

// The bounds match the title the upload dialog sends.
export const UpdateVideoTitleSchema = z.object({
  videoId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, "Enter a title.")
    .max(120, "Use 120 characters or fewer."),
});

export type UpdateVideoTitleInput = z.infer<typeof UpdateVideoTitleSchema>;
