import type { FeatureGate, PlanLimits } from "@/server/auth/config/subscription-plans";
import type { PrismaClient } from "@workspace/db/generated/prisma/client";
import {
  getMinimumRequiredPlanForFeature,
  type PlanDenial,
} from "./denial";
import { resolveOrganizationPlan } from "./resolve-organization-plan";

export type FeatureCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      denial: PlanDenial & { reason: "FEATURE_NOT_AVAILABLE" };
    };

export async function checkFeatureAccess(
  organizationId: string,
  feature: FeatureGate,
  prisma: PrismaClient,
): Promise<FeatureCheckResult> {
  const plan = await resolveOrganizationPlan(organizationId, prisma);

  if ((plan.limits as PlanLimits)[feature] === true) {
    return { allowed: true };
  }

  return {
    allowed: false,
    denial: {
      reason: "FEATURE_NOT_AVAILABLE",
      metadata: {
        feature,
        planName: plan.planName,
        minimumRequiredPlan: getMinimumRequiredPlanForFeature(feature),
      },
    },
  };
}
