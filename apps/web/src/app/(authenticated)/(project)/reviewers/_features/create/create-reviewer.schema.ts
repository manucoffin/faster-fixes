import z from "zod";

export const CreateReviewerSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
});

export type CreateReviewerInputs = z.infer<typeof CreateReviewerSchema>;
