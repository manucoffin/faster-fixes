import type { LimitableResource } from "@/server/auth/config/subscription-plans";
import type { PrismaClient } from "@workspace/db/generated/prisma/client";
import {
  getMinimumRequiredPlanForResource,
  type PlanDenial,
} from "./denial";
import { resolveOrganizationPlan } from "./resolve-organization-plan";

export type ResourceCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      denial: PlanDenial & { reason: "RESOURCE_LIMIT_EXCEEDED" };
    };

const RESOURCE_COUNT_QUERIES: Record<
  LimitableResource,
  (organizationId: string, prisma: PrismaClient) => Promise<number>
> = {
  projects: (orgId, prisma) =>
    prisma.project.count({ where: { organizationId: orgId } }),
  feedbacks: (orgId, prisma) =>
    prisma.feedback.count({ where: { project: { organizationId: orgId } } }),
  seats: (orgId, prisma) =>
    prisma.member.count({ where: { organizationId: orgId } }),
  organizations: () => {
    throw new Error("Use checkOrganizationLimit for organizations");
  },
};

export async function checkResourceLimit(
  organizationId: string,
  resource: LimitableResource,
  prisma: PrismaClient,
): Promise<ResourceCheckResult> {
  const plan = await resolveOrganizationPlan(organizationId, prisma);
  const limit = plan.limits[resource] as number;

  if (limit === Infinity) {
    return { allowed: true };
  }

  const current = await RESOURCE_COUNT_QUERIES[resource](organizationId, prisma);

  if (current < limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    denial: {
      reason: "RESOURCE_LIMIT_EXCEEDED",
      metadata: {
        resource,
        current,
        limit,
        planName: plan.planName,
        minimumRequiredPlan: getMinimumRequiredPlanForResource(resource, current),
      },
    },
  };
}
