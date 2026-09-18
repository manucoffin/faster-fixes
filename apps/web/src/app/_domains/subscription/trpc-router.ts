import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { getPlansPrices } from "./_services/get-plans-prices";
import { GetPlansPricesSchema } from "./_services/get-plans-prices.schema";
import { getStripeSubscription } from "./_services/get-stripe-subscription";
import { GetStripeSubscriptionSchema } from "./_services/get-stripe-subscription.schema";
import { upgradeSubscription } from "./_services/upgrade-subscription";
import { UpgradeSubscriptionSchema } from "./_services/upgrade-subscription.schema";

export const subscriptionRouter = router({
  upgrade: protectedProcedure
    .input(UpgradeSubscriptionSchema)
    .mutation(async ({ input }) =>
      upgradeSubscription({
        planName: input.planName,
        annual: input.annual,
        headers: await headers(),
      }),
    ),

  getPlansPrices: publicProcedure
    .input(GetPlansPricesSchema)
    .query(({ input }) => getPlansPrices(input)),

  getStripeSubscription: protectedProcedure
    .input(GetStripeSubscriptionSchema)
    .query(({ input }) => getStripeSubscription(input)),
});
