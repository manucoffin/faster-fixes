import type { StripePlan } from "@better-auth/stripe";

export enum SubscriptionPlanName {
  Basic = "basic",
  Premium = "premium",
}

export enum SubscriptionStatus {
  Incomplete = "incomplete",
  IncompleteExpired = "incomplete_expired",
  Trialing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Canceled = "canceled",
  Unpaid = "unpaid",
  Paused = "paused",
}

export const PLAN_FEATURES = {
  [SubscriptionPlanName.Basic]: [
    {
      id: "profile_visible",
      label: "Ton profil visible sur Tobalgo",
      highlighted: false,
    },
    {
      id: "professional_verified",
      label: `Profil référencé en tant que "professionnel responsable" (après validation)`,
      highlighted: false,
    },
    {
      id: "web_links",
      label: "Liens vers ton site web et tes contacts pros",
      highlighted: false,
    },
    {
      id: "newsletter_featured",
      label: "Mise en avant dans notre newsletter",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Premium]: [
    {
      id: "profile_visible",
      label: "Ton profil visible sur Tobalgo",
      highlighted: false,
    },
    {
      id: "professional_verified",
      label:
        'Profil référencé en tant que "professionnel responsable" (après validation)',
      highlighted: false,
    },
    {
      id: "web_links",
      label: "Liens vers ton site web et tes contacts pros",
      highlighted: false,
    },
    {
      id: "newsletter_featured",
      label: "Mise en avant dans notre newsletter",
      highlighted: false,
    },
    {
      id: "kylo_features",
      label: "Tous les avantages du plan Kylo ainsi que...",
      highlighted: true,
    },
    {
      id: "calendar_integration",
      label: "Agenda lié à ton calendrier professionnel",
      highlighted: false,
    },
    {
      id: "patient_files",
      label: "Fiches patients",
      highlighted: false,
    },
    {
      id: "online_booking",
      label: "Prise de RDV en ligne pour les pet-parents",
      highlighted: false,
    },
    {
      id: "appointment_notifications",
      label: "Notifications liées à tes RDV",
      highlighted: false,
    },
    {
      id: "appointment_history",
      label: "Historique de tes RDV",
      highlighted: false,
    },
  ],
};

export const SUBSCRIPTION_PLANS: StripePlan[] = [
  {
    name: SubscriptionPlanName.Basic,
    priceId: process.env.KYLO_MONTHLY_PRICE_ID,
    lookupKey: "kylo_monthly",
    annualDiscountPriceId: process.env.KYLO_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "kylo_yearly",
    limits: {
      seats: 1,
    },
    group: "",
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {},
      onTrialEnd: async (data) => {},
      onTrialExpired: async (subscription) => {},
    },
  },
  {
    name: SubscriptionPlanName.Premium,
    priceId: process.env.BALTO_MONTHLY_PRICE_ID,
    lookupKey: "balto_monthly",
    annualDiscountPriceId: process.env.BALTO_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "balto_yearly",
    limits: {
      seats: 1,
    },
    group: "",
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {},
      onTrialEnd: async (data) => {},
      onTrialExpired: async (subscription) => {},
    },
  },
];
