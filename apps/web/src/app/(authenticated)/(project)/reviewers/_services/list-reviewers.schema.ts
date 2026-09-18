import z from "zod";

export const ListReviewersSchema = z.object({
  projectId: z.string(),
});

export type ListReviewersInput = z.infer<typeof ListReviewersSchema>;
