import z from "zod";

export const HardDeleteFeedbackSchema = z.object({
  feedbackId: z.string(),
});

export type HardDeleteFeedbackSchemaType = z.infer<typeof HardDeleteFeedbackSchema>;
