import { auth } from "@/server/auth";
import { SubscriptionStatus } from "@/app/_domains/subscription";

export async function getSubscriptionStatus({ headers }: { headers: Headers }) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) return null;

  const subscriptions = await auth.api.listActiveSubscriptions({
    query: { referenceId: activeOrganization.id },
    headers,
  });

  // Only a trial or a subscription ending at the period end has a status the
  // banner announces; anything else resolves to null and renders nothing.
  const statusSubscription = subscriptions.find(
    (subscription) =>
      subscription.status === SubscriptionStatus.Trialing ||
      subscription.cancelAtPeriodEnd === true,
  );

  return statusSubscription ?? null;
}

export type GetSubscriptionStatusOutput = Awaited<
  ReturnType<typeof getSubscriptionStatus>
>;
