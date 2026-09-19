import { auth } from "@/server/auth";
import { SubscriptionStatus } from "../_helpers/subscription-plans";

export async function getActiveSubscription({ headers }: { headers: Headers }) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) return null;

  try {
    const subscriptions = await auth.api.listActiveSubscriptions({
      query: {
        referenceId: activeOrganization.id,
      },
      headers,
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

export type GetActiveSubscriptionOutput = Awaited<
  ReturnType<typeof getActiveSubscription>
>;
