import { router } from "@/server/trpc/trpc";
import { getPlansPrices } from "../price/get-plans-prices.trpc.query";
import { getStripeSubscription } from "../subscription/get-stripe-subscription.trpc.query";

export const stripeFeatureRouter = router({
  getPlansPrices,
  getStripeSubscription,
});
