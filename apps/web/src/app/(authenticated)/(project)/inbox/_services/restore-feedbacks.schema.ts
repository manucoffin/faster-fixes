import z from "zod";

export const RestoreFeedbacksSchema = z.object({
  projectId: z.string(),
  feedbackIds: z.array(z.string()).min(1),
});

export type RestoreFeedbacksInput = z.infer<typeof RestoreFeedbacksSchema>;
