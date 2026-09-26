import z from "zod";

export const RevokeReviewerSchema = z.object({
  reviewerId: z.string(),
});

export type RevokeReviewerInput = z.infer<typeof RevokeReviewerSchema>;
