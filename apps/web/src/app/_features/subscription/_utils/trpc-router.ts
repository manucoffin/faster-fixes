import { router } from "@/server/trpc/trpc";
import { upgradeSubscription } from "../upgrade-subscription/upgrade-subscription.trpc.mutation";

export const subscriptionFeatureRouter = router({
  upgrade: upgradeSubscription,
});
