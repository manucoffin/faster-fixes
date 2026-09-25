import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { deleteAsset } from "@/server/storage/delete-asset";
import { prisma } from "@workspace/db";
import type { DeleteFeedbacksInput } from "./delete-feedbacks.schema";

export async function deleteFeedbacks(
  { feedbackIds, userId }: DeleteFeedbacksInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedbackItems = await db.feedback.findMany({
    where: { id: { in: feedbackIds } },
    include: { project: { select: { organizationId: true } } },
  });

  if (feedbackItems.length === 0) {
    throw new NotFoundError("Feedback not found.");
  }

  const nonClosed = feedbackItems.find((f) => f.status !== "closed");
  if (nonClosed) {
    throw new BadRequestError(
      "Only archived feedback can be permanently deleted.",
    );
  }

  const firstItem = feedbackItems[0]!;

  // Membership in the Feedback's Organization needs the loaded rows, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: firstItem.project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const screenshotIds = feedbackItems
    .map((f) => f.screenshotId)
    .filter((id): id is string => id !== null);

  await Promise.all(screenshotIds.map((id) => deleteAsset(id)));

  await db.feedback.deleteMany({ where: { id: { in: feedbackIds } } });

  return { count: feedbackIds.length };
}
