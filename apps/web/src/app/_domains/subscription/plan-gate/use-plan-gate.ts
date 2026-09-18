"use client";

import { useSession } from "@/lib/auth";
import {
  type FeatureGate,
  PLAN_LIMITS,
  type PlanLimits,
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";

export function usePlanGate() {
  const { data: session } = useSession();

  const planName =
    (session?.session?.activePlanName as SubscriptionPlanName) ??
    SubscriptionPlanName.Free;
  const limits =
    (session?.session?.activePlanLimits as PlanLimits) ??
    PLAN_LIMITS[SubscriptionPlanName.Free];

  return {
    plan: planName,
    limits,
    isFreePlan: planName === SubscriptionPlanName.Free,
    canAccess: (feature: FeatureGate): boolean => {
      return limits[feature] === true;
    },
  };
}
