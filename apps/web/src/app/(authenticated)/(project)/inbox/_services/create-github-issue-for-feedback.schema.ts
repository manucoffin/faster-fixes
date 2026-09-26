import z from "zod";

export const CreateGitHubIssueForFeedbackSchema = z.object({
  feedbackId: z.string(),
});

export type CreateGitHubIssueForFeedbackInput = z.infer<
  typeof CreateGitHubIssueForFeedbackSchema
>;
