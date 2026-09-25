import { stripeApi } from "@/server/stripe";
import type Stripe from "stripe";
import { getMonthlyChurnRate } from "./get-monthly-churn-rate";

// Stripe exposes no direct "MRR" endpoint — the Dashboard figure is internal
// billing analytics. We reconstruct it the way Stripe does: each active
// subscription's recurring amount, normalized to one month, after discounts.
//
// Number of whole months in one billing period, used to normalize any cadence
// (annual, quarterly, weekly…) to a monthly figure.
function monthsPerPeriod(price: Stripe.Price): number {
  const count = price.recurring?.interval_count ?? 1;
  switch (price.recurring?.interval) {
    case "year":
      return 12 * count;
    case "week":
      return (12 / 52) * count;
    case "day":
      return (12 / 365) * count;
    case "month":
    default:
      return count;
  }
}

// Monthly recurring cents for a single subscription, after its discounts.
// We pull the active set from Stripe (not our `subscription` table): stale or
// test rows left at status "active" in the DB were inflating MRR.
function subscriptionMonthlyCents(subscription: Stripe.Subscription): number {
  let periodCents = 0;
  for (const item of subscription.items.data) {
    const price = item.price;
    // unit_amount excludes tax (for tax-exclusive prices) — the same basis
    // Stripe uses for MRR. Tiered prices have a null unit_amount; skip rather
    // than guess.
    if (!price.unit_amount) continue;

    // unit_amount is per seat; multiply by quantity so seat-based plans (e.g.
    // the 5-seat Agency) aren't collapsed to a single seat.
    const quantity = item.quantity ?? 1;
    periodCents += (price.unit_amount * quantity) / monthsPerPeriod(price);
  }

  // Apply subscription-level discounts. percent_off scales the whole figure;
  // amount_off is a fixed per-invoice reduction, normalized to monthly via the
  // first item's cadence (mixed-cadence + amount_off coupons are rare).
  const monthsForAmountOff = subscription.items.data[0]?.price
    ? monthsPerPeriod(subscription.items.data[0].price)
    : 1;
  for (const discount of subscription.discounts) {
    // This API version nests the coupon under `source` (string id until
    // expanded into a Coupon object).
    const source = typeof discount === "string" ? undefined : discount.source;
    const coupon =
      source && typeof source.coupon === "object" ? source.coupon : undefined;
    if (!coupon) continue;
    if (coupon.percent_off) {
      periodCents *= 1 - coupon.percent_off / 100;
    } else if (coupon.amount_off) {
      periodCents -= coupon.amount_off / monthsForAmountOff;
    }
  }

  return Math.max(0, periodCents);
}

export async function getMrr() {
  let totalMrrCents = 0;
  let activeCount = 0;

  // discounts.coupon must be expanded to read percent_off/amount_off; items and
  // their price are included on the subscription by default.
  try {
    for await (const subscription of stripeApi.subscriptions.list({
      status: "active",
      expand: ["data.discounts.source.coupon"],
      limit: 100,
    })) {
      activeCount += 1;
      totalMrrCents += subscriptionMonthlyCents(subscription);
    }
  } catch (error) {
    console.error("Failed to list Stripe subscriptions:", error);
  }

  // Gross = money charged to customers; net = what lands after Stripe fees and
  // refunds. Both must be gated to revenue-bearing transaction types: a payout
  // to the bank is itself a balance transaction with negative `net`, so summing
  // every type cancelled each charge against its later payout and net collapsed
  // to roughly the un-paid-out (recent) balance. `txn.net` already nets the
  // Stripe fee out of a charge, so summing net over these types yields true net
  // revenue without double-counting fees. `limit: 100` is the page size; the
  // `for await` auto-paginates the full history rather than capping at 100.
  const grossTypes = new Set(["charge", "payment"]);
  const netRevenueTypes = new Set([
    "charge",
    "payment",
    "refund",
    "payment_refund",
    "payment_failure_refund",
    "adjustment", // disputes / chargebacks
  ]);
  let grossRevenueCents = 0;
  let netRevenueCents = 0;
  try {
    for await (const txn of stripeApi.balanceTransactions.list({
      limit: 100,
    })) {
      if (grossTypes.has(txn.type)) {
        grossRevenueCents += txn.amount;
      }
      if (netRevenueTypes.has(txn.type)) {
        netRevenueCents += txn.net;
      }
    }
  } catch (error) {
    console.error("Failed to fetch Stripe balance transactions:", error);
  }

  const churnRate = await getMonthlyChurnRate();

  const mrr = totalMrrCents / 100;
  const arr = mrr * 12;
  const grossRevenue = grossRevenueCents / 100;
  const netRevenue = netRevenueCents / 100;

  // LTV = ARPA / monthly churn. Undefined when churn is 0 or there is no active
  // base to derive ARPA from — return null so the UI shows "—" instead of ∞.
  const arpa = activeCount > 0 ? mrr / activeCount : 0;
  const ltv = churnRate && churnRate > 0 ? arpa / churnRate : null;

  return { mrr, arr, grossRevenue, netRevenue, ltv };
}

export type GetMrrOutput = Awaited<ReturnType<typeof getMrr>>;
