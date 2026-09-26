import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackIntegrationIssueRequestedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import type { CreateLinearIssueForFeedbackInput } from "./create-linear-issue-for-feedback.schema";

export async function createLinearIssueForFeedback(
  {
    feedbackId,
    userId,
  }: CreateLinearIssueForFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        select: {
          organizationId: true,
          linearLink: { select: { id: true } },
        },
      },
      linearIssueLink: { select: { id: true } },
    },
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

  if (feedback.linearIssueLink) {
    throw new ConflictError("A Linear issue already exists for this feedback.");
  }

  if (!feedback.project.linearLink) {
    throw new BadRequestError("No Linear team linked to this project.");
  }

  await inngest.send(
    buildEvent(feedbackIntegrationIssueRequestedEvent, {
      feedbackId,
      target: "linear",
    }),
  );

  return { queued: true };
}
