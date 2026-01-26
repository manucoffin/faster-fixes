import { auth } from "@/server/auth";
import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { headers } from "next/headers";

export const getSubscriptionStatus = protectedProcedure.query(
  async ({ input }) => {
    try {
      const activeOrganization = await auth.api.getFullOrganization({
        headers: await headers(),
      });

      if (!activeOrganization) return null;

      // Fetch all subscriptions for the organization using better-auth Stripe plugin
      const subscriptions = await auth.api.listActiveSubscriptions({
        query: {
          referenceId: activeOrganization.id,
        },
        headers: await headers(),
      });

      // Find subscription that needs status display (trialing or cancel at period end)
      const statusSubscription = subscriptions.find(
        (sub) =>
          sub.status === SubscriptionStatus.Trialing ||
          sub.cancelAtPeriodEnd === true,
      );

      return statusSubscription ?? null;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription status",
        cause: error,
      });
    }
  },
);

export type GetSubscriptionStatusOutput = inferProcedureOutput<
  typeof getSubscriptionStatus
>;
