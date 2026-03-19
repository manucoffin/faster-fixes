import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { z } from "zod";

export const SubscriptionSchema = z.object({
  organizationId: z.string().min(1),
  plan: z.enum(SubscriptionPlanName),
  status: z.enum(SubscriptionStatus),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  trialStart: z.date().optional(),
  trialEnd: z.date().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

export type SubscriptionInputs = z.infer<typeof SubscriptionSchema>;

export const UpdateSubscriptionSchema = SubscriptionSchema.omit({
  stripeCustomerId: true,
  stripeSubscriptionId: true,
}).extend({ id: z.string().min(1) });

export type UpdateSubscriptionInputs = z.infer<typeof UpdateSubscriptionSchema>;
