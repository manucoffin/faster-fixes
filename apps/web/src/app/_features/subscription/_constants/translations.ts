import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";

export const SubscriptionStatusTranslation: Record<SubscriptionStatus, string> =
  {
    [SubscriptionStatus.Incomplete]: "Incomplete",
    [SubscriptionStatus.IncompleteExpired]: "Incomplete expired",
    [SubscriptionStatus.Trialing]: "Trial",
    [SubscriptionStatus.Active]: "Active",
    [SubscriptionStatus.PastDue]: "Past due",
    [SubscriptionStatus.Canceled]: "Canceled",
    [SubscriptionStatus.Unpaid]: "Unpaid",
    [SubscriptionStatus.Paused]: "Paused",
  };
