import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateFeedbackAssigneeInput } from "./update-feedback-assignee.schema";

export async function updateFeedbackAssignee(
  {
    feedbackId,
    assigneeId,
    userId,
  }: UpdateFeedbackAssigneeInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    include: { project: { select: { organizationId: true } } },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  // Membership in the Feedback's Organization needs the loaded row, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: feedback.project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  if (assigneeId) {
    // The assignee must be a Member of the same Organization, so an id from
    // another Organization reads as unknown rather than as a denial.
    const assignee = await db.member.findFirst({
      where: {
        id: assigneeId,
        organizationId: feedback.project.organizationId,
      },
    });

    if (!assignee) {
      throw new NotFoundError("Member not found.");
    }
  }

  await db.feedback.update({
    where: { id: feedbackId },
    data: { assigneeId },
  });

  return { id: feedbackId };
}
