import z from "zod";

export const UpdateFeedbackAssigneeSchema = z.object({
  feedbackId: z.string(),
  assigneeId: z.string().nullable(),
});

export type UpdateFeedbackAssigneeSchemaType = z.infer<typeof UpdateFeedbackAssigneeSchema>;
