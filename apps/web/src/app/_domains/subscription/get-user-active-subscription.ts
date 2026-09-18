import { auth } from "@/server/auth";
import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { headers } from "next/headers";

export async function getUserActiveSubscription() {
  const activeOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrganization) return null;

  try {
    const subscriptions = await auth.api.listActiveSubscriptions({
      query: {
        referenceId: activeOrganization.id,
      },
      headers: await headers(),
    });

    // get the active subscription
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
