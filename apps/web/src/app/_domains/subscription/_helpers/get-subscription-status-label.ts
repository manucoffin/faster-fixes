import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";

const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.Incomplete]: "Incomplete",
  [SubscriptionStatus.IncompleteExpired]: "Incomplete expired",
  [SubscriptionStatus.Trialing]: "Trial",
  [SubscriptionStatus.Active]: "Active",
  [SubscriptionStatus.PastDue]: "Past due",
  [SubscriptionStatus.Canceled]: "Canceled",
  [SubscriptionStatus.Unpaid]: "Unpaid",
  [SubscriptionStatus.Paused]: "Paused",
};

// Stripe may report a status this app does not model, so an unknown one has no
// label rather than a fabricated one.
export function getSubscriptionStatusLabel(status: string) {
  return SUBSCRIPTION_STATUS_LABELS[status as SubscriptionStatus];
}
