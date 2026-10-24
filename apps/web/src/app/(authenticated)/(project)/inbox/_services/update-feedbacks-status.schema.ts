import z from "zod";

export const UpdateFeedbacksStatusSchema = z.object({
  projectId: z.string(),
  feedbackIds: z.array(z.string()).min(1),
  status: z.enum(["new", "in_progress", "resolved", "closed"]),
});

export type UpdateFeedbacksStatusInput = z.infer<
  typeof UpdateFeedbacksStatusSchema
>;
