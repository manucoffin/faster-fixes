import type {
  PLAN_LIMITS,
  SubscriptionPlanName,
} from "../_helpers/subscription-plans";

export type PlanLimits = (typeof PLAN_LIMITS)[SubscriptionPlanName];

export type LimitableResource = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
}[keyof PlanLimits];

export type FeatureGate = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];
