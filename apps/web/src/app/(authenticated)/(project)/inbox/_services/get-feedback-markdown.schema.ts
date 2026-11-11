import z from "zod";

export const GetFeedbackMarkdownSchema = z.object({
  projectId: z.string(),
  feedbackId: z.string(),
});

export type GetFeedbackMarkdownInput = z.infer<
  typeof GetFeedbackMarkdownSchema
>;
