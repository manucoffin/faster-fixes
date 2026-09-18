import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { DeleteProjectInput } from "./delete-project.schema";

export async function deleteProject(
  { projectId, userId }: DeleteProjectInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  await db.project.delete({ where: { id: projectId } });

  return { id: projectId };
}
