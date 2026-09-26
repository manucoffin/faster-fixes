"use client";

import { useSession } from "@/lib/auth";
import {
  PLAN_LIMITS,
  SubscriptionPlanName,
} from "../_helpers/subscription-plans";
import type { FeatureGate } from "../_types/plan-limits";

export function usePlanGate() {
  const { data: session } = useSession();

  const planName = (session?.session.activePlanName ??
    SubscriptionPlanName.Free) as SubscriptionPlanName;
  const limits =
    session?.session.activePlanLimits ?? PLAN_LIMITS[SubscriptionPlanName.Free];

  return {
    plan: planName,
    limits,
    isFreePlan: planName === SubscriptionPlanName.Free,
    canAccess: (feature: FeatureGate): boolean => {
      return limits[feature] === true;
    },
  };
}
