import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UnlinkLinearTeamInput } from "./unlink-linear-team.schema";

export async function unlinkLinearTeam(
  { projectId, userId }: UnlinkLinearTeamInput & { userId: string },
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
    throw new ForbiddenError("Only owners and admins can unlink Linear teams.");
  }

  await db.projectLinearLink.deleteMany({ where: { projectId } });

  return { success: true };
}
