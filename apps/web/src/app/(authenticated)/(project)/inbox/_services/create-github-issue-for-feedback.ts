import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";
import { CreateGitHubIssueForFeedbackInput } from "./create-github-issue-for-feedback.schema";

export async function createGitHubIssueForFeedback(
  {
    feedbackId,
    userId,
  }: CreateGitHubIssueForFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      project: {
        select: {
          organizationId: true,
          gitHubLink: { select: { id: true } },
        },
      },
      issueLink: { select: { id: true } },
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

  if (feedback.issueLink) {
    throw new ConflictError("A GitHub issue already exists for this feedback.");
  }

  if (!feedback.project.gitHubLink) {
    throw new BadRequestError("No GitHub repository linked to this project.");
  }

  await inngest.send({
    name: "feedback/integration-issue-requested",
    data: { feedbackId, target: "github" },
  });

  return { queued: true };
}
