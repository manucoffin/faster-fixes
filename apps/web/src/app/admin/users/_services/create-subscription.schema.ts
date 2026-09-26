import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/app/_domains/subscription";
import { z } from "zod";

export const CreateSubscriptionSchema = z.object({
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

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
