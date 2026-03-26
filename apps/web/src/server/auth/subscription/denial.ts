import {
  type FeatureGate,
  type LimitableResource,
  PLAN_LIMITS,
  type PlanLimits,
  type SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";

export type ResourceLimitMetadata = {
  resource: LimitableResource;
  current: number;
  limit: number;
  planName: SubscriptionPlanName;
  minimumRequiredPlan: SubscriptionPlanName;
};

export type FeatureGateMetadata = {
  feature: FeatureGate;
  planName: SubscriptionPlanName;
  minimumRequiredPlan: SubscriptionPlanName;
};

export type PlanDenial =
  | { reason: "RESOURCE_LIMIT_EXCEEDED"; metadata: ResourceLimitMetadata }
  | { reason: "FEATURE_NOT_AVAILABLE"; metadata: FeatureGateMetadata }
  | { reason: "UNAUTHENTICATED"; metadata: null }
  | { reason: "NO_ACTIVE_ORGANIZATION"; metadata: null };

const PLAN_ORDER: SubscriptionPlanName[] = ["free", "pro", "agency"] as const as SubscriptionPlanName[];

export function getMinimumRequiredPlanForResource(
  resource: LimitableResource,
  currentCount: number,
): SubscriptionPlanName {
  for (const plan of PLAN_ORDER) {
    const limit = PLAN_LIMITS[plan][resource] as number;
    if (limit === Infinity || currentCount < limit) return plan;
  }
  return "agency" as SubscriptionPlanName;
}

export function getMinimumRequiredPlanForFeature(
  feature: FeatureGate,
): SubscriptionPlanName {
  for (const plan of PLAN_ORDER) {
    if ((PLAN_LIMITS[plan] as PlanLimits)[feature] === true) return plan;
  }
  return "agency" as SubscriptionPlanName;
}
