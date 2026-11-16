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
import type { CreateTrelloCardForFeedbackInput } from "./create-trello-card-for-feedback.schema";

export async function createTrelloCardForFeedback(
  { feedbackId, userId }: CreateTrelloCardForFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        select: {
          organizationId: true,
          trelloLink: { select: { id: true } },
        },
      },
      trelloIssueLink: { select: { id: true } },
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

  if (feedback.trelloIssueLink) {
    throw new ConflictError("A Trello card already exists for this feedback.");
  }

  if (!feedback.project.trelloLink) {
    throw new BadRequestError("No Trello board linked to this project.");
  }

  await inngest.send(
    buildEvent(feedbackIntegrationIssueRequestedEvent, {
      feedbackId,
      target: "trello",
    }),
  );

  return { queued: true };
}
