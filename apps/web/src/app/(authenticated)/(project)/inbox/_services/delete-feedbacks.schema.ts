import z from "zod";

export const DeleteFeedbacksSchema = z.object({
  feedbackIds: z.array(z.string()).min(1),
});

export type DeleteFeedbacksInput = z.infer<typeof DeleteFeedbacksSchema>;
