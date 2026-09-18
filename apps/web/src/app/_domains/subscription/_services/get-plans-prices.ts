import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import Stripe from "stripe";

export async function getPlansPrices({ planNames }: { planNames: string[] }) {
  const pricesMap: Record<
    string,
    { monthly: Stripe.Price | null; annual: Stripe.Price | null }
  > = {};

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
      // One unreachable price must not blank the whole pricing table, so the
      // plan is reported as priceless and the others keep loading.
      console.error(`Failed to fetch Stripe price for ${planName}:`, error);
      pricesMap[planName] = { monthly: null, annual: null };
    }
  }

  return pricesMap;
}

export type GetPlansPricesOutput = Awaited<ReturnType<typeof getPlansPrices>>;
