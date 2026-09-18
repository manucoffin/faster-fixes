/* eslint-disable local/schema-must-be-pure-zod -- The plan names and statuses
   live in the server plan configuration, which migration step 5 relocates out
   of `@/server`. Until then this is the one impure schema of the app: mirroring
   the enums by hand would let them drift from the source of truth. */
import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
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
