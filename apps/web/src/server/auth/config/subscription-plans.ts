import type { StripePlan } from "@better-auth/stripe";

export enum SubscriptionPlanName {
  Free = "free",
  Pro = "pro",
  Agency = "agency",
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

export const PLAN_LIMITS = {
  [SubscriptionPlanName.Free]: {
    projects: 1,
    feedbacks: 50,
    seats: 1,
    organizations: 1,
    githubIntegration: false,
    whiteLabel: false,
  },
  [SubscriptionPlanName.Pro]: {
    projects: 5,
    feedbacks: Infinity,
    seats: 5,
    organizations: Infinity,
    githubIntegration: true,
    whiteLabel: true,
  },
  [SubscriptionPlanName.Agency]: {
    projects: Infinity,
    feedbacks: Infinity,
    seats: Infinity,
    organizations: Infinity,
    githubIntegration: true,
    whiteLabel: true,
  },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[SubscriptionPlanName];

export type LimitableResource = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
}[keyof PlanLimits];

export type FeatureGate = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];

export const PLAN_PRICES = {
  [SubscriptionPlanName.Free]: 0,
  [SubscriptionPlanName.Pro]: 20,
  [SubscriptionPlanName.Agency]: 99,
} as const;

export const PLAN_DESCRIPTIONS = {
  [SubscriptionPlanName.Free]:
    "Get started with one project. Ideal for testing and solo use.",
  [SubscriptionPlanName.Pro]:
    "For small teams managing multiple client projects.",
  [SubscriptionPlanName.Agency]:
    "For agencies with many concurrent projects and large teams.",
};

export const PLAN_FEATURES = {
  [SubscriptionPlanName.Free]: [
    {
      id: "projects",
      label: "1 project",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Up to 50 feedback items",
      highlighted: false,
    },
    {
      id: "seats",
      label: "1 team member",
      highlighted: false,
    },
    {
      id: "widget",
      label: "Website feedback widget",
      highlighted: false,
    },
    {
      id: "dashboard",
      label: "Feedback management dashboard",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Pro]: [
    {
      id: "includes_free",
      label: "Everything in Free",
      highlighted: true,
    },
    {
      id: "projects",
      label: "Up to 5 projects",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Unlimited feedback",
      highlighted: false,
    },
    {
      id: "seats",
      label: "Up to 5 team members",
      highlighted: false,
    },
    {
      id: "github_integration",
      label: "GitHub integration",
      highlighted: false,
    },
    {
      id: "white_label",
      label: "White-label widget",
      highlighted: false,
    },
    {
      id: "priority_email_support",
      label: "Priority email support",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Agency]: [
    {
      id: "includes_pro",
      label: "Everything in Pro",
      highlighted: true,
    },
    {
      id: "projects",
      label: "Unlimited projects",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Unlimited feedback",
      highlighted: false,
    },
    {
      id: "seats",
      label: "Unlimited team members",
      highlighted: false,
    },
    {
      id: "priority_support",
      label: "Priority email support",
      highlighted: false,
    },
  ],
};

export const SUBSCRIPTION_PLANS: StripePlan[] = [
  {
    name: SubscriptionPlanName.Pro,
    priceId: process.env.PRO_MONTHLY_PRICE_ID,
    lookupKey: "pro_monthly",
    annualDiscountPriceId: process.env.PRO_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "pro_yearly",
    limits: {
      seats: PLAN_LIMITS[SubscriptionPlanName.Pro].seats,
    },
    group: "",
  },
  {
    name: SubscriptionPlanName.Agency,
    priceId: process.env.AGENCY_MONTHLY_PRICE_ID,
    lookupKey: "agency_monthly",
    annualDiscountPriceId: process.env.AGENCY_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "agency_yearly",
    limits: {
      seats: PLAN_LIMITS[SubscriptionPlanName.Agency].seats,
    },
    group: "",
  },
];
