import { NotFoundError } from "@/server/errors/domain-errors";
import { stripeApi } from "@/server/stripe";
import type Stripe from "stripe";
import { getOrganizationSubscription } from "./get-organization-subscription";

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
  { headers }: { headers: Headers },
  stripe: Stripe = stripeApi,
) {
  // The identifier comes from the caller's active Organization, never from the
  // client, so a User reads no Subscription but their own Organization's.
  const organizationSubscription = await getOrganizationSubscription({
    headers,
  });
  const stripeSubscriptionId = organizationSubscription?.stripeSubscriptionId;

  if (!stripeSubscriptionId) return null;

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
