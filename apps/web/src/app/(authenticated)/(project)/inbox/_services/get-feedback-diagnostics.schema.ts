import z from "zod";

export const GetFeedbackDiagnosticsSchema = z.object({
  projectId: z.string(),
  feedbackId: z.string(),
});

export type GetFeedbackDiagnosticsInput = z.infer<
  typeof GetFeedbackDiagnosticsSchema
>;
