import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";
import { UpdateFeedbacksStatusInput } from "./update-feedbacks-status.schema";

export async function updateFeedbacksStatus(
  {
    feedbackIds,
    status,
    userId,
  }: UpdateFeedbacksStatusInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const firstFeedback = await db.feedback.findUnique({
    where: { id: feedbackIds[0] },
    include: { project: { select: { organizationId: true } } },
  });

  if (!firstFeedback) {
    throw new NotFoundError("Feedback not found.");
  }

  // Membership in the Feedback's Organization needs the loaded row, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: firstFeedback.project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  await db.feedback.updateMany({
    where: { id: { in: feedbackIds } },
    data: { status },
  });

  // Fan-out: one event per feedback so each gets independent retries and
  // fault isolation — a single failing GitHub sync won't block the others.
  const events = feedbackIds.map((feedbackId) => ({
    name: "feedback/status-changed" as const,
    // Dashboard bulk edits are always a human in the inbox.
    data: { feedbackId, newStatus: status, actor: "user" as const },
  }));
  inngest.send(events).catch(() => {});

  return { count: feedbackIds.length };
}
