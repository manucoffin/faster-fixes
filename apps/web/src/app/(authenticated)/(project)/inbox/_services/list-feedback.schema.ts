import z from "zod";

export const ListFeedbackSchema = z.object({
  projectId: z.string(),
});

export type ListFeedbackInput = z.infer<typeof ListFeedbackSchema>;
