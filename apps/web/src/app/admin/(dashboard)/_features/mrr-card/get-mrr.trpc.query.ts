import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { prisma } from "@workspace/db/index";
import Stripe from "stripe";

export const getMrr = adminProcedure.query(async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.Active },
    select: { stripeSubscriptionId: true },
  });

  let totalMrr = 0;

  for (const subscription of subscriptions) {
    if (!subscription.stripeSubscriptionId) continue;

    try {
      const stripeSubscription = await stripeApi.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
        { expand: ["items.data.price"] }
      );

      for (const item of stripeSubscription.items.data) {
        const price = item.price as Stripe.Price;

        if (!price.unit_amount) continue;

        let monthlyAmount = price.unit_amount;

        if (price.recurring?.interval === "year") {
          monthlyAmount = price.unit_amount / 12;
        }

        totalMrr += monthlyAmount;
      }
    } catch (error) {
      console.error(
        `Failed to fetch Stripe subscription ${subscription.stripeSubscriptionId}:`,
        error
      );
    }
  }

  // Get actual revenue received from Stripe
  let totalRevenue = 0;
  try {
    const balanceTransactions = await stripeApi.balanceTransactions.list({
      type: "charge",
      limit: 100,
    });

    // Sum net amounts (actual money received after Stripe fees)
    totalRevenue = balanceTransactions.data.reduce(
      (sum, txn) => sum + txn.net,
      0
    );
  } catch (error) {
    console.error("Failed to fetch Stripe balance transactions:", error);
  }

  const mrrInEuros = totalMrr / 100; // Convert cents to euros
  const arr = mrrInEuros * 12; // Annual Recurring Revenue
  const totalRevenueInEuros = totalRevenue / 100; // Convert cents to euros

  return { mrr: mrrInEuros, arr, totalRevenue: totalRevenueInEuros };
});

export type GetMrrOutput = inferProcedureOutput<typeof getMrr>;
