import z from "zod";

export const DeleteFeedbackRecordingSchema = z.object({
  feedbackId: z.string(),
});

export type DeleteFeedbackRecordingInput = z.infer<
  typeof DeleteFeedbackRecordingSchema
>;
