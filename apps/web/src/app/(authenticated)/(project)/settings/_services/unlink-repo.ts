import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UnlinkRepoInput } from "./unlink-repo.schema";

export async function unlinkRepo(
  { projectId, userId }: UnlinkRepoInput & { userId: string },
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
    throw new ForbiddenError("Only owners and admins can unlink repositories.");
  }

  await db.projectGitHubLink.deleteMany({ where: { projectId } });

  return { success: true };
}
