import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { LinkLinearTeamInput } from "./link-linear-team.schema";

export async function linkLinearTeam(
  {
    projectId,
    teamId,
    teamKey,
    teamName,
    defaultStateId,
    defaultLabelIds,
    defaultPriority,
    autoCreateIssues,
    userId,
  }: LinkLinearTeamInput & { userId: string },
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
    throw new ForbiddenError("Only owners and admins can link Linear teams.");
  }

  const installation = await db.linearInstallation.findUnique({
    where: { organizationId: project.organizationId },
  });

  if (!installation) {
    throw new BadRequestError(
      "No Linear installation found. Connect Linear first.",
    );
  }

  const link = await db.projectLinearLink.upsert({
    where: { projectId },
    update: {
      linearInstallationId: installation.id,
      teamId,
      teamKey,
      teamName,
      defaultStateId,
      defaultLabelIds,
      defaultPriority,
      autoCreateIssues,
      linkHealthIssue: null,
    },
    create: {
      projectId,
      linearInstallationId: installation.id,
      teamId,
      teamKey,
      teamName,
      defaultStateId,
      defaultLabelIds,
      defaultPriority,
      autoCreateIssues,
    },
  });

  return { id: link.id };
}
