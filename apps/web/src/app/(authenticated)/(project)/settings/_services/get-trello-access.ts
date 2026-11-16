import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

type GetTrelloAccessArgs = {
  userId: string;
  projectId: string;
  // Reads (pickers) allow any member; writes are owner/admin only.
  requireAdmin: boolean;
  adminDeniedMessage?: string;
};

/**
 * Resolves the Organization owning the Project, checks the caller's
 * membership, and returns the Organization's Trello Installation. Like the Jira
 * twin, the Organization comes from the Project rather than the caller's active
 * membership, so a User in several Organizations never reads another one's
 * Trello boards.
 */
export async function getTrelloAccess(
  { userId, projectId, requireAdmin, adminDeniedMessage }: GetTrelloAccessArgs,
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

  const installation = await db.trelloInstallation.findUnique({
    where: { organizationId: project.organizationId },
    select: { id: true, healthState: true },
  });

  if (!installation) {
    throw new BadRequestError("Trello is not connected. Connect Trello first.");
  }

  if (installation.healthState === "reconnect_required") {
    throw new BadRequestError(
      "The Trello connection needs to be re-authorized.",
    );
  }

  return { organizationId: project.organizationId, installation };
}

export type GetTrelloAccessOutput = Awaited<ReturnType<typeof getTrelloAccess>>;
