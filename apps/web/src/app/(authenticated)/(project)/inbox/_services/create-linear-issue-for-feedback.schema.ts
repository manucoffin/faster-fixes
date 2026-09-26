import z from "zod";

export const CreateLinearIssueForFeedbackSchema = z.object({
  feedbackId: z.string(),
});

export type CreateLinearIssueForFeedbackInput = z.infer<
  typeof CreateLinearIssueForFeedbackSchema
>;
