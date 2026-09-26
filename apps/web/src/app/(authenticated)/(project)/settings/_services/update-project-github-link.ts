import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateProjectGitHubLinkInput } from "./update-project-github-link.schema";

export async function updateProjectGitHubLink(
  {
    projectId,
    autoCreateIssues,
    defaultLabels,
    userId,
  }: UpdateProjectGitHubLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const link = await db.projectGitHubLink.findUnique({
    where: { projectId },
    include: { project: { select: { organizationId: true } } },
  });

  if (!link) {
    throw new NotFoundError("No GitHub link found for this project.");
  }

  // Privileged membership in the linked Project's Organization needs the
  // loaded link, so the denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: link.project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only owners and admins can update repository settings.",
    );
  }

  await db.projectGitHubLink.update({
    where: { projectId },
    data: {
      ...(autoCreateIssues !== undefined && { autoCreateIssues }),
      ...(defaultLabels !== undefined && { defaultLabels }),
    },
  });

  return { success: true };
}
