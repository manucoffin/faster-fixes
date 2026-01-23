import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { prisma } from "@workspace/db";

export const getActiveSubscriptions = adminProcedure.query(async () => {
  try {
    const activeOrTrialingStatus = [
      SubscriptionStatus.Active,
      SubscriptionStatus.Trialing,
    ];

    const [totalCount, kyloCount, baltoCount, userCount] = await Promise.all([
      prisma.subscription.count({
        where: { status: { in: activeOrTrialingStatus } },
      }),
      prisma.subscription.count({
        where: {
          status: { in: activeOrTrialingStatus },
          plan: "kylo",
        },
      }),
      prisma.subscription.count({
        where: {
          status: { in: activeOrTrialingStatus },
          plan: "balto",
        },
      }),
      prisma.user.count(),
    ]);

    const conversionRate =
      userCount > 0 ? Math.round((totalCount / userCount) * 100) : 0;

    return {
      totalCount,
      kyloCount,
      baltoCount,
      userCount,
      conversionRate,
      kyloPercentage:
        totalCount > 0 ? Math.round((kyloCount / totalCount) * 100) : 0,
      baltoPercentage:
        totalCount > 0 ? Math.round((baltoCount / totalCount) * 100) : 0,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get active subscriptions",
      cause: error,
    });
  }
});

export type GetActiveSubscriptionsOutput = inferProcedureOutput<
  typeof getActiveSubscriptions
>;
