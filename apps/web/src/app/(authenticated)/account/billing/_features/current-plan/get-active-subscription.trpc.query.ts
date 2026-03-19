import { getUserActiveSubscription } from "@/app/_features/subscription/get-user-active-subscription";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";

export const getActiveSubscription = protectedProcedure.query(
  async ({ input }) => {
    try {
      // Fetch active subscriptions for the organization using better-auth Stripe plugin
      const activeSubscription = await getUserActiveSubscription();

      return activeSubscription;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch active subscription",
        cause: error,
      });
    }
  },
);

export type GetActiveSubscriptionOutput = inferProcedureOutput<
  typeof getActiveSubscription
>;
