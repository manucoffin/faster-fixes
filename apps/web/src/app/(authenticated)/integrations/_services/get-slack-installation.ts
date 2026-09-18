import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function getSlackInstallation(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // The denial reads the loaded membership, so it belongs here rather than at
  // the transport edge. Any member may read the installation.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const installation = await db.slackInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    include: {
      installedBy: { include: { user: { select: { name: true } } } },
    },
  });

  if (!installation) return null;

  // The active project is the org's first project, matching how the rest of the
  // integration features resolve the current project.
  const activeProject = await db.project.findFirst({
    where: { organizationId: activeOrganization.id },
    orderBy: { createdAt: "asc" },
  });

  const projectLink = activeProject
    ? await db.projectSlackLink.findUnique({
        where: { projectId: activeProject.id },
        select: {
          channelId: true,
          channelName: true,
          enabled: true,
          linkHealthy: true,
          healthIssue: true,
        },
      })
    : null;

  return {
    id: installation.id,
    teamName: installation.slackTeamName,
    installedByName: installation.installedBy?.user.name ?? null,
    createdAt: installation.createdAt,
    projectLink,
  };
}

export type GetSlackInstallationOutput = Awaited<
  ReturnType<typeof getSlackInstallation>
>;
