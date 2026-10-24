import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { planRankPlacement } from "../_helpers/feedback-rank-placement";
import type { MoveFeedbackInput } from "./move-feedback.schema";
import { updateFeedbackStatus } from "./update-feedback-status";

// Reordering is not an edit of the Feedback (ADR-0017): within a column only
// `feedback_rank` rows are written, so `updatedAt` stays put and no Tracker or
// Slack sync runs. A move to another column is a Status change first.
export async function moveFeedback(
  {
    projectId,
    feedbackId,
    status,
    beforeId,
    afterId,
    userId,
  }: MoveFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  // A Feedback outside the Project is skipped, never reported, so the response
  // does not reveal whether the id exists in another Organization.
  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, projectId },
    select: { id: true, status: true },
  });

  if (!feedback) {
    return { moved: false };
  }

  // The Status service emits its event even on an unchanged Status (ADR-0007),
  // so a same-column move must never reach it. It runs before the Rank write
  // because the trigger clears the Rank on a Status change.
  if (feedback.status !== status) {
    await updateFeedbackStatus({ feedbackId, status, userId }, db);
  }

  // The server reads the column itself: the board's copy can be stale, so the
  // client sends neighbours, never a key.
  const column = await db.feedback.findMany({
    where: { projectId, status },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      rank: { select: { key: true } },
    },
  });

  const writes = planRankPlacement({
    column: column.map((f) => ({ ...f, rank: f.rank?.key ?? null })),
    movedId: feedbackId,
    beforeId,
    afterId,
  });

  await db.$transaction(
    writes.map(({ feedbackId: id, key }) =>
      db.feedbackRank.upsert({
        where: { feedbackId: id },
        create: { feedbackId: id, key },
        update: { key },
      }),
    ),
  );

  return { moved: true };
}
