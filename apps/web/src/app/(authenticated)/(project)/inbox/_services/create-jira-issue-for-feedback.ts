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
import type { CreateJiraIssueForFeedbackInput } from "./create-jira-issue-for-feedback.schema";

export async function createJiraIssueForFeedback(
  { feedbackId, userId }: CreateJiraIssueForFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        select: {
          organizationId: true,
          jiraLink: { select: { id: true } },
        },
      },
      jiraIssueLink: { select: { id: true } },
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

  if (feedback.jiraIssueLink) {
    throw new ConflictError("A Jira issue already exists for this feedback.");
  }

  if (!feedback.project.jiraLink) {
    throw new BadRequestError("No Jira project linked to this project.");
  }

  await inngest.send(
    buildEvent(feedbackIntegrationIssueRequestedEvent, {
      feedbackId,
      target: "jira",
    }),
  );

  return { queued: true };
}
