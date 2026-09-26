import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deregisterProjectJiraWebhook } from "@/app/_domains/integration/_services/jira/webhook-registration";
import { prisma } from "@workspace/db";
import type { UnlinkJiraProjectInput } from "./unlink-jira-project.schema";

// Not plan-gated: downgraded users must always be able to unlink. Deliberately
// does not use getJiraAccess — unlinking must stay possible even when the
// org-level installation is gone or needs re-authorization.
export async function unlinkJiraProject(
  { projectId, userId }: UnlinkJiraProjectInput & { userId: string },
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
    throw new ForbiddenError(
      "Only owners and admins can unlink Jira projects.",
    );
  }

  const link = await db.projectJiraLink.findUnique({
    where: { projectId },
    include: { jiraInstallation: true },
  });

  if (link) {
    await deregisterProjectJiraWebhook(link);
  }

  await db.projectJiraLink.deleteMany({ where: { projectId } });

  return { success: true };
}
