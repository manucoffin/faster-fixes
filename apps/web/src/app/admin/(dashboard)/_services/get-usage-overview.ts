import { prisma } from "@workspace/db";
import {
  getEngagedOrganizationWhere,
  nonInternalOrganizationWhere,
  nonInternalSignupWhere,
} from "@/app/_domains/organization";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type GetUsageOverviewInput = {
  now: Date;
};

export async function getUsageOverview({ now }: GetUsageOverviewInput) {
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const previousWindowStart = new Date(now.getTime() - 2 * WINDOW_MS);

  const countSignups = (gte: Date, lt: Date) =>
    prisma.user.count({
      where: { ...nonInternalSignupWhere, createdAt: { gte, lt } },
    });

  // Engaged 30 days ago is rebuilt from Feedback creation dates in the
  // preceding window, so both counts share one definition.
  const countEngagedOrganizations = (gte: Date, lt: Date) =>
    prisma.organization.count({
      where: {
        ...nonInternalOrganizationWhere,
        ...getEngagedOrganizationWhere(gte, lt),
      },
    });

  const [
    signups,
    previousSignups,
    engagedOrganizations,
    previousEngagedOrganizations,
  ] = await Promise.all([
    countSignups(windowStart, now),
    countSignups(previousWindowStart, windowStart),
    countEngagedOrganizations(windowStart, now),
    countEngagedOrganizations(previousWindowStart, windowStart),
  ]);

  return {
    signups: { current: signups, previous: previousSignups },
    engagedOrganizations: {
      current: engagedOrganizations,
      previous: previousEngagedOrganizations,
    },
  };
}

export type GetUsageOverviewOutput = Awaited<
  ReturnType<typeof getUsageOverview>
>;
