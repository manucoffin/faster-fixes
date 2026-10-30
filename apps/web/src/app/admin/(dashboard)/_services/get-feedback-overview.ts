import {
  FeedbackStatusEnum,
  type FeedbackStatus,
} from "@/app/_domains/feedback";
import { prisma } from "@workspace/db";
import { nonInternalOrganizationWhere } from "@/app/_domains/organization";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const nonInternalFeedbackWhere = {
  project: { organization: nonInternalOrganizationWhere },
};

type GetFeedbackOverviewInput = {
  now: Date;
};

export async function getFeedbackOverview({ now }: GetFeedbackOverviewInput) {
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const previousWindowStart = new Date(now.getTime() - 2 * WINDOW_MS);

  const countReceived = (gte: Date, lt: Date) =>
    prisma.feedback.count({
      where: { ...nonInternalFeedbackWhere, createdAt: { gte, lt } },
    });

  const countByStatus = (status: FeedbackStatus) =>
    prisma.feedback.count({ where: { ...nonInternalFeedbackWhere, status } });

  const [received, previousReceived, pending, resolved, archived] =
    await Promise.all([
      countReceived(windowStart, now),
      countReceived(previousWindowStart, windowStart),
      countByStatus(FeedbackStatusEnum.enum.new),
      countByStatus(FeedbackStatusEnum.enum.resolved),
      // Archived is stored as `closed` (see CONTEXT.md).
      countByStatus(FeedbackStatusEnum.enum.closed),
    ]);

  return {
    received: { current: received, previous: previousReceived },
    pending,
    resolved,
    archived,
  };
}

export type GetFeedbackOverviewOutput = Awaited<
  ReturnType<typeof getFeedbackOverview>
>;
