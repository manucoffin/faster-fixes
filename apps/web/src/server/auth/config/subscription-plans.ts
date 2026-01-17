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
      id: "user_profiles",
      label: "User profile creation and management",
      highlighted: false,
    },
    {
      id: "basic_analytics",
      label: "Basic analytics and usage reports",
      highlighted: false,
    },
    {
      id: "email_support",
      label: "Email support",
      highlighted: false,
    },
    {
      id: "api_access",
      label: "Standard API access",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Premium]: [
    {
      id: "user_profiles",
      label: "User profile creation and management",
      highlighted: false,
    },
    {
      id: "basic_analytics",
      label: "Basic analytics and usage reports",
      highlighted: false,
    },
    {
      id: "email_support",
      label: "Email support",
      highlighted: false,
    },
    {
      id: "api_access",
      label: "Standard API access",
      highlighted: false,
    },
    {
      id: "premium_features",
      label: "All Basic plan features plus...",
      highlighted: true,
    },
    {
      id: "advanced_analytics",
      label: "Advanced analytics and custom reports",
      highlighted: false,
    },
    {
      id: "priority_support",
      label: "Priority email and chat support",
      highlighted: false,
    },
    {
      id: "integrations",
      label: "Third-party integrations",
      highlighted: false,
    },
    {
      id: "custom_branding",
      label: "Custom branding options",
      highlighted: false,
    },
    {
      id: "advanced_api",
      label: "Premium API access with higher rate limits",
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
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {},
      onTrialEnd: async (data) => {},
      onTrialExpired: async (subscription) => {},
    },
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
    freeTrial: {
      days: 14,
      onTrialStart: async (subscription) => {},
      onTrialEnd: async (data) => {},
      onTrialExpired: async (subscription) => {},
    },
  },
];
