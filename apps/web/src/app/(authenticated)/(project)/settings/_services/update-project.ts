import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { UpdateProjectInput } from "./update-project.schema";

export async function updateProject(
  {
    projectId,
    name,
    domain,
    widgetEnabled,
    userId,
  }: UpdateProjectInput & { userId: string },
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

  await db.project.update({
    where: { id: projectId },
    data: {
      name,
      domain,
      widgetConfig: {
        update: {
          enabled: widgetEnabled,
        },
      },
    },
  });

  return { id: projectId };
}
