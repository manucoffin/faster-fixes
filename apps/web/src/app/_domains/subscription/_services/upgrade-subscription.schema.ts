import { z } from "zod";

export const UpgradeSubscriptionSchema = z.object({
  planName: z.string(),
  annual: z.boolean().optional(),
});

export type UpgradeSubscriptionInput = z.infer<
  typeof UpgradeSubscriptionSchema
>;
