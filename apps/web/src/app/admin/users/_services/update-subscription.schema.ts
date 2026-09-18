import { z } from "zod";
import { CreateSubscriptionSchema } from "./create-subscription.schema";

// The Stripe identifiers are not editable from the admin form: they are owned
// by the Stripe webhook.
export const UpdateSubscriptionSchema = CreateSubscriptionSchema.omit({
  stripeCustomerId: true,
  stripeSubscriptionId: true,
}).extend({ id: z.string().min(1) });

export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
