import { auth } from "@/server/auth";
import { SubscriptionStatus } from "../_helpers/subscription-plans";

export async function getOrganizationSubscription({
  headers,
}: {
  headers: Headers;
}) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) return null;

  try {
    const subscriptions = await auth.api.listActiveSubscriptions({
      query: {
        referenceId: activeOrganization.id,
      },
      headers,
    });

    // The Organization's Subscription is the one Stripe reports as active or
    // trialing; any other status reads as no Subscription.
    const activeSubscription = subscriptions.find(
      (sub) =>
        sub.status === SubscriptionStatus.Active ||
        sub.status === SubscriptionStatus.Trialing,
    );

    return activeSubscription ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export type GetOrganizationSubscriptionOutput = Awaited<
  ReturnType<typeof getOrganizationSubscription>
>;
