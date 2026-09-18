import { z } from "zod";

export const GetStripeSubscriptionSchema = z.object({
  stripeSubscriptionId: z.string(),
});

export type GetStripeSubscriptionInput = z.infer<
  typeof GetStripeSubscriptionSchema
>;
