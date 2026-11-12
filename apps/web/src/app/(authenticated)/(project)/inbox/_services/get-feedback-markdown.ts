import { formatFeedbackAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { getFeedback } from "@/app/_domains/feedback/_services/get-feedback";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetFeedbackMarkdownInput } from "./get-feedback-markdown.schema";

/**
 * The markdown document of one Feedback, built by the same service as the
 * agent route's `?format=markdown`, so a Member copies what an agent reads.
 */
export async function getFeedbackMarkdown(
  {
    projectId,
    feedbackId,
    userId,
  }: GetFeedbackMarkdownInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const { item, videoTitle } = await getFeedback(
    { feedbackId, projectIds: [projectId] },
    db,
  );

  return formatFeedbackAsMarkdown({ ...item, videoTitle });
}

export type GetFeedbackMarkdownOutput = Awaited<
  ReturnType<typeof getFeedbackMarkdown>
>;
