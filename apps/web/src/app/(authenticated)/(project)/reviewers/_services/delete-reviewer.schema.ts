import z from "zod";

export const DeleteReviewerSchema = z.object({
  reviewerId: z.string(),
});

export type DeleteReviewerInput = z.infer<typeof DeleteReviewerSchema>;
