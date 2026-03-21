import z from "zod";

export const UpdateFeedbackStatusSchema = z.object({
  feedbackId: z.string(),
  status: z.enum(["new", "in_progress", "resolved", "closed"]),
});

export type UpdateFeedbackStatusSchemaType = z.infer<typeof UpdateFeedbackStatusSchema>;
