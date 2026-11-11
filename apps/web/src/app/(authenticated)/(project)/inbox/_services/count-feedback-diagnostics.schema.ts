import z from "zod";

export const CountFeedbackDiagnosticsSchema = z.object({
  feedbackId: z.string(),
});

export type CountFeedbackDiagnosticsInput = z.infer<
  typeof CountFeedbackDiagnosticsSchema
>;
