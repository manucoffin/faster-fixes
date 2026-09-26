import z from "zod";

export const RestoreReviewerSchema = z.object({
  reviewerId: z.string(),
});

export type RestoreReviewerInput = z.infer<typeof RestoreReviewerSchema>;
