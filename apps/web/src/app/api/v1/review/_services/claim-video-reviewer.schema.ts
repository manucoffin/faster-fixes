import { z } from "zod";

export const ClaimVideoReviewerSchema = z.object({
  // "  Surprising   Cat " and "Surprising Cat" are the same name.
  name: z
    .string()
    .transform((name) => name.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, "Enter a name.")
        .max(50, "The name must be 50 characters or fewer."),
    ),
});

export type ClaimVideoReviewerInput = z.infer<typeof ClaimVideoReviewerSchema>;
