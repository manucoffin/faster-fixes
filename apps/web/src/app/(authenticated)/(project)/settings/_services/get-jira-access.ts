import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

type GetJiraAccessArgs = {
  userId: string;
  projectId: string;
  // Reads (pickers, current link) allow any member; writes are owner/admin only.
  requireAdmin: boolean;
  adminDeniedMessage?: string;
};

/**
 * Resolves the organization owning the project, checks the caller's membership,
 * and returns the org's Jira installation. Every project-scoped Jira service
 * needs this same three-step preamble, and getting the org from the project (not
 * from the caller's active membership) is what keeps a user in several orgs from
 * reading another org's Jira site.
 */
export async function getJiraAccess(
  { userId, projectId, requireAdmin, adminDeniedMessage }: GetJiraAccessArgs,
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
    where: {
      organizationId: project.organizationId,
      userId,
      ...(requireAdmin ? { role: { in: ["owner", "admin"] } } : {}),
    },
  });

  if (!membership) {
    throw new ForbiddenError(adminDeniedMessage ?? "Access denied.");
  }

  const installation = await db.jiraInstallation.findUnique({
    where: { organizationId: project.organizationId },
    select: { id: true, cloudId: true, siteUrl: true, healthState: true },
  });

  if (!installation) {
    throw new BadRequestError(
      "Jira is not connected. Connect a Jira site first.",
    );
  }

  if (installation.healthState === "reconnect_required") {
    throw new BadRequestError("The Jira connection needs to be re-authorized.");
  }

  return { organizationId: project.organizationId, installation };
}

export type GetJiraAccessOutput = Awaited<ReturnType<typeof getJiraAccess>>;
