import { z } from "zod";

export const GetUserEmailSchema = z.object({
  userId: z.string().min(1),
});

export type GetUserEmailInput = z.infer<typeof GetUserEmailSchema>;
