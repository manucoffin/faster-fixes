import z from "zod";

export const CreateTrelloCardForFeedbackSchema = z.object({
  feedbackId: z.string(),
});

export type CreateTrelloCardForFeedbackInput = z.infer<
  typeof CreateTrelloCardForFeedbackSchema
>;
