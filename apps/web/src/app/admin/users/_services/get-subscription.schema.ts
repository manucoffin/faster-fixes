import { z } from "zod";

export const GetSubscriptionSchema = z.object({
  userId: z.string().min(1),
});

export type GetSubscriptionInput = z.infer<typeof GetSubscriptionSchema>;
