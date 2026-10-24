import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAssets } from "@/server/storage/delete-assets";
import { prisma } from "@workspace/db";
import type { DeleteFeedbacksInput } from "./delete-feedbacks.schema";

export async function deleteFeedbacks(
  { projectId, feedbackIds, userId }: DeleteFeedbacksInput & { userId: string },
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

  const requested = new Set(feedbackIds).size;

  // Ids outside the Project or no longer Archived are skipped rather than
  // refused: a teammate may restore part of a selection while it is confirmed.
  const where = { id: { in: feedbackIds }, projectId, status: "closed" };

  const candidates = await db.feedback.findMany({
    where,
    select: { screenshotId: true },
  });

  if (candidates.length === 0) {
    return { deleted: 0, requested };
  }

  const { count: deleted } = await db.feedback.deleteMany({ where });

  const screenshotIds = candidates
    .map((f) => f.screenshotId)
    .filter((id): id is string => id !== null);

  if (screenshotIds.length > 0) {
    // A row restored between the read and the delete still references its
    // screenshot, so only the Assets no Feedback points to anymore are freed.
    const orphaned = await db.asset.findMany({
      where: { id: { in: screenshotIds }, feedbackScreenshots: { none: {} } },
      select: { id: true },
    });
    await deleteAssets(orphaned.map((asset) => asset.id));
  }

  return { deleted, requested };
}
