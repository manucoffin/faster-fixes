import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import Stripe from "stripe";
/**
 * Converts a Stripe subscription status string to the SubscriptionStatus enum type
 * @param stripeStatus The raw status string from Stripe API
 * @returns The corresponding SubscriptionStatus enum value
 */
export const formatSubscriptionStatus = (
  stripeStatus: Stripe.Subscription.Status,
) => {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    incomplete: SubscriptionStatus.Incomplete,
    incomplete_expired: SubscriptionStatus.IncompleteExpired,
    trialing: SubscriptionStatus.Trialing,
    active: SubscriptionStatus.Active,
    past_due: SubscriptionStatus.PastDue,
    canceled: SubscriptionStatus.Canceled,
    unpaid: SubscriptionStatus.Unpaid,
    paused: SubscriptionStatus.Paused,
  };

  // Use a simple try-catch instead of tryCatch since this is synchronous
  try {
    const status = statusMap[stripeStatus];
    if (!status) {
      throw new Error(`Invalid subscription status: ${stripeStatus}`);
    }
    return status;
  } catch (error) {
    console.error(
      `Error formatting subscription status: ${error instanceof Error ? error.message : String(error)}`,
    );
    return SubscriptionStatus.Unpaid; // Default fallback
  }
};
