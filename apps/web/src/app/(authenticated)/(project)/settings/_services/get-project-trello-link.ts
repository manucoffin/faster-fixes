import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetProjectTrelloLinkInput } from "./get-project-trello-link.schema";

export async function getProjectTrelloLink(
  { projectId, userId }: GetProjectTrelloLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Not through `getTrelloAccess`: the current link must stay readable even
  // when the Installation needs re-authorization.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  return db.projectTrelloLink.findUnique({
    where: { projectId },
    select: {
      id: true,
      boardId: true,
      boardName: true,
      boardUrl: true,
      newListId: true,
      inProgressListId: true,
      resolvedListId: true,
      autoCreateIssues: true,
      defaultLabelIds: true,
      linkHealthIssue: true,
    },
  });
}

export type GetProjectTrelloLinkOutput = Awaited<
  ReturnType<typeof getProjectTrelloLink>
>;
