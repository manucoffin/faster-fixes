import { NotFoundError } from "@/server/errors/domain-errors";
import { stripeApi } from "@/server/stripe";
import type Stripe from "stripe";

// Stripe reports an identifier it does not know as an invalid request carrying
// this code, on the error object rather than through a distinct class.
function isUnknownStripeResource(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "resource_missing"
  );
}

export async function getStripeSubscription(
  { stripeSubscriptionId }: { stripeSubscriptionId: string },
  stripe: Stripe = stripeApi,
) {
  try {
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    return {
      id: subscription.id,
      items: subscription.items.data,
      // Get the price from the first item (most subscriptions have one)
      currentPriceId: subscription.items.data[0]?.price?.id,
    };
  } catch (error) {
    if (isUnknownStripeResource(error)) {
      throw new NotFoundError("Subscription not found.");
    }

    throw error;
  }
}

export type GetStripeSubscriptionOutput = Awaited<
  ReturnType<typeof getStripeSubscription>
>;
