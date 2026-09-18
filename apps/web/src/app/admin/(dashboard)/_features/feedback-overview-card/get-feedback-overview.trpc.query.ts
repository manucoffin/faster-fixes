import { adminProcedure } from "@/server/trpc/trpc";
import { FeedbackStatusEnum } from "@/app/_domains/feedback/feedback-status";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { prisma } from "@workspace/db";

// "resolved" and "closed" (rendered as "Archived") are both terminal states;
// see CONTEXT.md glossary. Counted together as the resolved metric.
const resolvedStatuses = [
  FeedbackStatusEnum.enum.resolved,
  FeedbackStatusEnum.enum.closed,
];

export const getFeedbackOverview = adminProcedure.query(async () => {
  try {
    const [totalCount, resolvedCount, userCount] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: { in: resolvedStatuses } } }),
      prisma.user.count(),
    ]);

    return {
      totalCount,
      resolvedCount,
      resolvedPercentage:
        totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      // Average submissions per platform user — proxy for product usage.
      avgPerUser:
        userCount > 0 ? Math.round((totalCount / userCount) * 10) / 10 : 0,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get feedback overview",
      cause: error,
    });
  }
});

export type GetFeedbackOverviewOutput = inferProcedureOutput<
  typeof getFeedbackOverview
>;
