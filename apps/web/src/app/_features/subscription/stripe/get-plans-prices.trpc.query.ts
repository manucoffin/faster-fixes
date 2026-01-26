import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import { publicProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";

export const getPlansPrices = publicProcedure
  .input(
    z.object({
      planNames: z.array(z.string()),
    }),
  )
  .query(async ({ input }) => {
    const { planNames } = input;

    try {
      const pricesMap: Record<
        string,
        { monthly: Stripe.Price | null; annual: Stripe.Price | null }
      > = {};

      // Fetch price information for each plan
      for (const planName of planNames) {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName);

        if (!plan || !plan.priceId) {
          pricesMap[planName] = { monthly: null, annual: null };
          continue;
        }

        try {
          const monthlyPrice = await stripeApi.prices.retrieve(plan.priceId);
          const annualPrice = plan.annualDiscountPriceId
            ? await stripeApi.prices.retrieve(plan.annualDiscountPriceId)
            : null;

          pricesMap[planName] = {
            monthly: monthlyPrice,
            annual: annualPrice,
          };
        } catch (error) {
          console.error(`Failed to fetch Stripe price for ${planName}:`, error);
          pricesMap[planName] = { monthly: null, annual: null };
        }
      }

      return pricesMap;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch Stripe prices",
        cause: error,
      });
    }
  });

export type GetPlansPricesOutput = inferProcedureOutput<typeof getPlansPrices>;
