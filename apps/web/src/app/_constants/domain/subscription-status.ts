import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";

export const SubscriptionStatusTranslation: Record<SubscriptionStatus, string> =
  {
    [SubscriptionStatus.Incomplete]: "Incomplet",
    [SubscriptionStatus.IncompleteExpired]: "Incomplet expiré",
    [SubscriptionStatus.Trialing]: "Période d'essai",
    [SubscriptionStatus.Active]: "Actif",
    [SubscriptionStatus.PastDue]: "En retard",
    [SubscriptionStatus.Canceled]: "Annulé",
    [SubscriptionStatus.Unpaid]: "Non payé",
    [SubscriptionStatus.Paused]: "Suspendu",
  };
