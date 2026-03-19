import z from "zod";

export const CreateReviewerSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1, "Le nom est requis"),
});

export type CreateReviewerInputs = z.infer<typeof CreateReviewerSchema>;
