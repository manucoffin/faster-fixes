import z from "zod";

export const CreateJiraIssueForFeedbackSchema = z.object({
  feedbackId: z.string(),
});

export type CreateJiraIssueForFeedbackInput = z.infer<
  typeof CreateJiraIssueForFeedbackSchema
>;
