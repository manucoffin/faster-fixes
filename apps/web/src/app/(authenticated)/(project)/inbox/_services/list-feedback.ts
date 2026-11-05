import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import {
  inboxFeedbackInclude,
  toInboxFeedbackItem,
} from "./_inbox-feedback-projection";
import type { ListFeedbackInput } from "./list-feedback.schema";

export async function listFeedback(
  { projectId, userId }: ListFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

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

  const feedback = await db.feedback.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: inboxFeedbackInclude,
  });

  return Promise.all(feedback.map(toInboxFeedbackItem));
}

export type ListFeedbackOutput = Awaited<ReturnType<typeof listFeedback>>;
