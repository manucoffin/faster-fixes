import {
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";
import type { PrismaClient } from "@workspace/db/generated/prisma/client";
import {
  getMinimumRequiredPlanForResource,
  type PlanDenial,
} from "./denial";
import { resolveOrganizationPlan } from "./resolve-organization-plan";

export type OrganizationCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      denial: PlanDenial & { reason: "RESOURCE_LIMIT_EXCEEDED" };
    };

export async function checkOrganizationLimit(
  userId: string,
  prisma: PrismaClient,
): Promise<OrganizationCheckResult> {
  const memberships = await prisma.member.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  // If user has a paid plan on any org, they can create more orgs
  for (const { organizationId } of memberships) {
    const plan = await resolveOrganizationPlan(organizationId, prisma);
    if (!plan.isFreePlan) {
      return { allowed: true };
    }
  }

  const orgCount = memberships.length;

  if (orgCount < 1) {
    return { allowed: true };
  }

  return {
    allowed: false,
    denial: {
      reason: "RESOURCE_LIMIT_EXCEEDED",
      metadata: {
        resource: "organizations",
        current: orgCount,
        limit: 1,
        planName: SubscriptionPlanName.Free,
        minimumRequiredPlan: getMinimumRequiredPlanForResource("organizations", orgCount),
      },
    },
  };
}
