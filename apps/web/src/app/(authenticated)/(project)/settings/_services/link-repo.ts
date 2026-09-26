import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { LinkRepoInput } from "./link-repo.schema";

export async function linkRepo(
  {
    projectId,
    repoId,
    repoOwner,
    repoName,
    repoFullName,
    autoCreateIssues,
    defaultLabels,
    userId,
  }: LinkRepoInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Privileged membership in the Project's Organization needs the loaded
  // Project, so the denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can link repositories.");
  }

  const installation = await db.gitHubInstallation.findFirst({
    where: { organizationId: project.organizationId },
  });

  if (!installation) {
    throw new BadRequestError(
      "No GitHub installation found. Connect GitHub first.",
    );
  }

  const link = await db.projectGitHubLink.upsert({
    where: { projectId },
    update: {
      repoId,
      repoOwner,
      repoName,
      repoFullName,
      autoCreateIssues,
      defaultLabels,
    },
    create: {
      projectId,
      gitHubInstallationId: installation.id,
      repoId,
      repoOwner,
      repoName,
      repoFullName,
      autoCreateIssues,
      defaultLabels,
    },
  });

  return { id: link.id };
}
