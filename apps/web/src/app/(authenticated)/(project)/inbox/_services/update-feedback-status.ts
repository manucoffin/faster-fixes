import { prismaStatusConvergence } from "@/app/_domains/integration/_services/_prisma-status-convergence";
import {
  updateStatus,
  type StatusConvergence,
} from "@/app/_domains/integration/_services/update-status";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateFeedbackStatusInput } from "./update-feedback-status.schema";

export async function updateFeedbackStatus(
  {
    feedbackId,
    status,
    userId,
  }: UpdateFeedbackStatusInput & { userId: string },
  db: typeof prisma = prisma,
  convergence: StatusConvergence = prismaStatusConvergence(db),
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

  // Dashboard edits are always a human in the inbox, so a no-op still
  // converges the Trackers (ADR-0007).
  await updateStatus(
    { feedbackIds: [feedbackId], status, actor: "user" },
    convergence,
  );

  return { id: feedbackId };
}
