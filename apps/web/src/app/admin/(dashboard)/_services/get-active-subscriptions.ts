import {
  SubscriptionPlanName,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { prisma } from "@workspace/db";
import { getMonthlyChurnRate } from "./get-monthly-churn-rate";

export async function getActiveSubscriptions() {
  const activeOrTrialingStatus = [
    SubscriptionStatus.Active,
    SubscriptionStatus.Trialing,
  ];

  // better-auth/stripe stores `plan` as the plan name ("pro"/"agency"),
  // so filtering must use SubscriptionPlanName, not internal codenames.
  const [totalCount, proCount, agencyCount, userCount, churnRate] =
    await Promise.all([
      prisma.subscription.count({
        where: { status: { in: activeOrTrialingStatus } },
      }),
      prisma.subscription.count({
        where: {
          status: { in: activeOrTrialingStatus },
          plan: SubscriptionPlanName.Pro,
        },
      }),
      prisma.subscription.count({
        where: {
          status: { in: activeOrTrialingStatus },
          plan: SubscriptionPlanName.Agency,
        },
      }),
      prisma.user.count(),
      getMonthlyChurnRate(),
    ]);

  const conversionRate =
    userCount > 0 ? Math.round((totalCount / userCount) * 100) : 0;

  return {
    totalCount,
    proCount,
    agencyCount,
    userCount,
    conversionRate,
    churnRate,
    proPercentage:
      totalCount > 0 ? Math.round((proCount / totalCount) * 100) : 0,
    agencyPercentage:
      totalCount > 0 ? Math.round((agencyCount / totalCount) * 100) : 0,
  };
}

export type GetActiveSubscriptionsOutput = Awaited<
  ReturnType<typeof getActiveSubscriptions>
>;
