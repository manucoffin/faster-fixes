import z from "zod";

export const MoveFeedbackSchema = z.object({
  projectId: z.string(),
  feedbackId: z.string(),
  // Archived Feedback has no column, so it has no Rank either.
  status: z.enum(["new", "in_progress", "resolved"]),
  beforeId: z.string().nullable(),
  afterId: z.string().nullable(),
});

export type MoveFeedbackInput = z.infer<typeof MoveFeedbackSchema>;
