import {
  PLAN_LIMITS,
  type PlanLimits,
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { isCloud } from "@/utils/environment/env";
import type { PrismaClient, Subscription } from "@workspace/db/generated/prisma/client";

export type ResolvedPlan = {
  planName: SubscriptionPlanName;
  limits: PlanLimits;
  status: SubscriptionStatus | null;
  subscription: Subscription | null;
  isFreePlan: boolean;
};

const ACTIVE_STATUSES = new Set<string>([
  SubscriptionStatus.Active,
  SubscriptionStatus.Trialing,
]);

export async function resolveOrganizationPlan(
  organizationId: string,
  prisma: PrismaClient,
): Promise<ResolvedPlan> {
  // Self-hosted instances get full access without billing
  if (!isCloud()) {
    return {
      planName: SubscriptionPlanName.Agency,
      limits: PLAN_LIMITS[SubscriptionPlanName.Agency],
      status: SubscriptionStatus.Active,
      subscription: null,
      isFreePlan: false,
    };
  }
  const subscription = await prisma.subscription.findFirst({
    where: { referenceId: organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return buildFreePlan(null);
  }

  const status = subscription.status as SubscriptionStatus | null;

  if (!status) {
    return buildFreePlan(subscription);
  }

  // active or trialing — grant subscribed plan
  if (ACTIVE_STATUSES.has(status)) {
    return buildPaidPlan(subscription, status);
  }

  // canceled but still within paid period
  if (
    status === SubscriptionStatus.Canceled &&
    subscription.periodEnd &&
    new Date(subscription.periodEnd) > new Date()
  ) {
    return buildPaidPlan(subscription, status);
  }

  // everything else falls back to free
  return buildFreePlan(subscription);
}

function buildFreePlan(subscription: Subscription | null): ResolvedPlan {
  return {
    planName: SubscriptionPlanName.Free,
    limits: PLAN_LIMITS[SubscriptionPlanName.Free],
    status: (subscription?.status as SubscriptionStatus) ?? null,
    subscription,
    isFreePlan: true,
  };
}

function buildPaidPlan(
  subscription: Subscription,
  status: SubscriptionStatus,
): ResolvedPlan {
  const planName = (subscription.plan as SubscriptionPlanName) || SubscriptionPlanName.Free;
  const limits = PLAN_LIMITS[planName] ?? PLAN_LIMITS[SubscriptionPlanName.Free];

  return {
    planName,
    limits,
    status,
    subscription,
    isFreePlan: planName === SubscriptionPlanName.Free,
  };
}
