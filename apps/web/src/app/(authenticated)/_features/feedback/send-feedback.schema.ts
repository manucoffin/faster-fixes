import { z } from "zod";

export const SendFeedbackSchema = z.object({
  message: z
    .string()
    .min(1, "Le message est requis")
    .max(2000, "Le message ne doit pas dépasser 2000 caractères"),
});

export type SendFeedbackInputs = z.infer<typeof SendFeedbackSchema>;
