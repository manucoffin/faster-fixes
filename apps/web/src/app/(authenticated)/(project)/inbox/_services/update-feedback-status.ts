import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";
import type { UpdateFeedbackStatusInput } from "./update-feedback-status.schema";

export async function updateFeedbackStatus(
  {
    feedbackId,
    status,
    userId,
  }: UpdateFeedbackStatusInput & { userId: string },
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

  await db.feedback.update({
    where: { id: feedbackId },
    data: { status },
  });

  // Fire-and-forget: sync status to the linked tracker if there is one. Fans
  // out even on a no-op, unlike the agent API's service, which skips it: a
  // human in the inbox does not re-set the same status in a loop. The asymmetry
  // is deliberate; see ADR-0007.
  inngest
    .send({
      name: "feedback/status-changed",
      // Dashboard edits are always a human in the inbox.
      data: { feedbackId, newStatus: status, actor: "user" },
    })
    .catch(() => {});

  return { id: feedbackId };
}
