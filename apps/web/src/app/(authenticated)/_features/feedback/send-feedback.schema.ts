import { z } from "zod";

export const SendFeedbackSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message must not exceed 2000 characters"),
});

export type SendFeedbackInputs = z.infer<typeof SendFeedbackSchema>;
