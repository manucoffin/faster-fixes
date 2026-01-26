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

export const PLAN_DESCRIPTIONS = {
  [SubscriptionPlanName.Basic]:
    "Parfait pour commencer. Accédez aux fonctionnalités essentielles pour gérer votre profil et analyser vos données.",
  [SubscriptionPlanName.Premium]:
    "Notre meilleur plan. Accédez à des outils avancés, des intégrations et un support prioritaire.",
};

export const PLAN_FEATURES = {
  [SubscriptionPlanName.Basic]: [
    {
      id: "user_profiles",
      label: "Création et gestion de profils utilisateur",
      highlighted: false,
    },
    {
      id: "basic_analytics",
      label: "Analyses basiques et rapports d'utilisation",
      highlighted: false,
    },
    {
      id: "email_support",
      label: "Support par email",
      highlighted: false,
    },
    {
      id: "api_access",
      label: "Accès API standard",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Premium]: [
    {
      id: "user_profiles",
      label: "Création et gestion de profils utilisateur",
      highlighted: false,
    },
    {
      id: "basic_analytics",
      label: "Analyses basiques et rapports d'utilisation",
      highlighted: false,
    },
    {
      id: "email_support",
      label: "Support par email",
      highlighted: false,
    },
    {
      id: "api_access",
      label: "Accès API standard",
      highlighted: false,
    },
    {
      id: "premium_features",
      label: "Toutes les fonctionnalités du plan Basic",
      highlighted: true,
    },
    {
      id: "advanced_analytics",
      label: "Analyses avancées et rapports personnalisés",
      highlighted: false,
    },
    {
      id: "priority_support",
      label: "Support prioritaire par email et chat",
      highlighted: false,
    },
    {
      id: "integrations",
      label: "Intégrations avec des services tiers",
      highlighted: false,
    },
    {
      id: "custom_branding",
      label: "Options de branding personnalisé",
      highlighted: false,
    },
    {
      id: "advanced_api",
      label: "Accès API premium avec limites de débit élevées",
      highlighted: false,
    },
  ],
};

export const SUBSCRIPTION_PLANS: StripePlan[] = [
  {
    name: SubscriptionPlanName.Basic,
    priceId: process.env.BASIC_MONTHLY_PRICE_ID,
    lookupKey: "basic_monthly",
    annualDiscountPriceId: process.env.BASIC_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "basic_yearly",
    limits: {
      seats: 1,
    },
    group: "",
    // freeTrial: {
    //   days: 0,
    //   onTrialStart: async (subscription) => {},
    //   onTrialEnd: async (data) => {},
    //   onTrialExpired: async (subscription) => {},
    // },
  },
  {
    name: SubscriptionPlanName.Premium,
    priceId: process.env.PREMIUM_MONTHLY_PRICE_ID,
    lookupKey: "premium_monthly",
    annualDiscountPriceId: process.env.PREMIUM_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "premium_yearly",
    limits: {
      seats: 1,
    },
    group: "",
    // freeTrial: {
    //   days: 0,
    //   onTrialStart: async (subscription) => {},
    //   onTrialEnd: async (data) => {},
    //   onTrialExpired: async (subscription) => {},
    // },
  },
];
