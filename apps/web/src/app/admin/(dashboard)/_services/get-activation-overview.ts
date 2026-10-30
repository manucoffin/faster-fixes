import { PLAN_LIMITS, SubscriptionPlanName } from "@/app/_domains/subscription";
import { getStripeApi } from "@/server/stripe";
import { prisma } from "@workspace/db";
import type Stripe from "stripe";
import {
  getEngagedOrganizationWhere,
  nonInternalOrganizationWhere,
} from "@/app/_domains/organization";
import { getBillingMetrics } from "./get-billing-metrics";

const DAY_MS = 24 * 60 * 60 * 1000;
const FUNNEL_WINDOW_MS = 90 * DAY_MS;
const WINDOW_MS = 30 * DAY_MS;

const NEAR_LIMIT_SHARE = 0.8;
const NEAR_LIMIT_FEEDBACK_COUNT = Math.ceil(
  PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks * NEAR_LIMIT_SHARE,
);

export async function getActivationOverview(
  { now }: { now: Date },
  stripe: Stripe = getStripeApi(),
) {
  const funnelStart = new Date(now.getTime() - FUNNEL_WINDOW_MS);
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  // The paying step reads the same Stripe set as the Paying organizations
  // card, never the local Subscription mirror.
  const { payingOrganizationIds } = await getBillingMetrics({ now }, stripe);

  // Adoption bases are the non-internal Paying and Engaged organizations, so
  // a share never mixes internal numerators with an external base.
  const payingWhere = {
    ...nonInternalOrganizationWhere,
    id: { in: payingOrganizationIds },
  };
  const engagedWhere = {
    ...nonInternalOrganizationWhere,
    ...getEngagedOrganizationWhere(windowStart, now),
  };
  const funnelWhere = {
    ...nonInternalOrganizationWhere,
    createdAt: { gte: funnelStart, lt: now },
  };

  const [
    created,
    withProject,
    withFeedback,
    paying,
    payingBase,
    withTracker,
    withSlack,
    engagedBase,
    withAgentToken,
    freeProjects,
  ] = await Promise.all([
    prisma.organization.count({ where: funnelWhere }),
    prisma.organization.count({
      where: { ...funnelWhere, projects: { some: {} } },
    }),
    prisma.organization.count({
      where: { ...funnelWhere, projects: { some: { feedback: { some: {} } } } },
    }),
    prisma.organization.count({
      where: { ...funnelWhere, id: { in: payingOrganizationIds } },
    }),
    prisma.organization.count({ where: payingWhere }),
    prisma.organization.count({
      where: {
        ...payingWhere,
        OR: [
          { gitHubInstallations: { some: {} } },
          { linearInstallation: { isNot: null } },
          { jiraInstallation: { isNot: null } },
        ],
      },
    }),
    prisma.organization.count({
      where: { ...payingWhere, slackInstallation: { isNot: null } },
    }),
    prisma.organization.count({ where: engagedWhere }),
    prisma.organization.count({
      where: {
        ...engagedWhere,
        agentTokens: { some: { lastUsedAt: { gte: windowStart, lt: now } } },
      },
    }),
    // The free Feedback limit is lifetime and counted across every Project of
    // the Organization, the same count the limit check makes.
    prisma.project.findMany({
      where: {
        organization: {
          ...nonInternalOrganizationWhere,
          id: { notIn: payingOrganizationIds },
        },
        feedback: { some: {} },
      },
      select: { organizationId: true, _count: { select: { feedback: true } } },
    }),
  ]);

  const feedbackCountByOrganization = new Map<string, number>();
  for (const project of freeProjects) {
    feedbackCountByOrganization.set(
      project.organizationId,
      (feedbackCountByOrganization.get(project.organizationId) ?? 0) +
        project._count.feedback,
    );
  }
  const freeNearLimitCount = [...feedbackCountByOrganization.values()].filter(
    (count) => count >= NEAR_LIMIT_FEEDBACK_COUNT,
  ).length;

  return {
    funnel: { created, withProject, withFeedback, paying },
    adoption: {
      tracker: { count: withTracker, base: payingBase },
      slack: { count: withSlack, base: payingBase },
      agentToken: { count: withAgentToken, base: engagedBase },
    },
    freeNearLimit: {
      count: freeNearLimitCount,
      threshold: NEAR_LIMIT_FEEDBACK_COUNT,
      limit: PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks,
    },
  };
}

export type GetActivationOverviewOutput = Awaited<
  ReturnType<typeof getActivationOverview>
>;
