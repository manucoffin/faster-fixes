import { router } from "@/server/trpc/trpc";
import { getPlansPrices } from "../stripe/get-plans-prices.trpc.query";
import { getStripeSubscription } from "../stripe/get-stripe-subscription.trpc.query";
import { upgradeSubscription } from "../upgrade-subscription/upgrade-subscription.trpc.mutation";

export const subscriptionFeatureRouter = router({
  upgrade: upgradeSubscription,
  getPlansPrices: getPlansPrices,
  getStripeSubscription: getStripeSubscription,
});
