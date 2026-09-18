import { getActiveSubscription as getActiveSubscriptionForSession } from "@/app/_domains/subscription/_services/get-active-subscription";
import { protectedProcedure } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { inferProcedureOutput, TRPCError } from "@trpc/server";

export const getActiveSubscription = protectedProcedure.query(async () => {
  try {
    // Fetch active subscriptions for the organization using better-auth Stripe plugin
    const activeSubscription = await getActiveSubscriptionForSession({
      headers: await headers(),
    });

    return activeSubscription;
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch active subscription",
      cause: error,
    });
  }
});

export type GetActiveSubscriptionOutput = inferProcedureOutput<
  typeof getActiveSubscription
>;
