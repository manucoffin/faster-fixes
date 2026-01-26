import { stripeApi } from "@/server/stripe";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const getStripeSubscription = protectedProcedure
  .input(
    z.object({
      stripeSubscriptionId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    const { stripeSubscriptionId } = input;

    try {
      const subscription = await stripeApi.subscriptions.retrieve(
        stripeSubscriptionId,
      );

      return {
        id: subscription.id,
        items: subscription.items.data,
        // Get the price from the first item (most subscriptions have one)
        currentPriceId: subscription.items.data[0]?.price?.id,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch Stripe subscription",
        cause: error,
      });
    }
  });
