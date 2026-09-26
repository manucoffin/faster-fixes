import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { GetProjectGitHubLinkInput } from "./get-project-github-link.schema";

export async function getProjectGitHubLink(
  { projectId, userId }: GetProjectGitHubLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

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

  const link = await db.projectGitHubLink.findUnique({
    where: { projectId },
    select: {
      id: true,
      repoFullName: true,
      repoOwner: true,
      repoName: true,
      autoCreateIssues: true,
      defaultLabels: true,
    },
  });

  return link;
}

export type GetProjectGitHubLinkOutput = Awaited<
  ReturnType<typeof getProjectGitHubLink>
>;
