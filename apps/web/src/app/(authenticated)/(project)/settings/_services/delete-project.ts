import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAssets } from "@/server/storage/delete-assets";
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

  // The Feedback cascade only nulls each screenshot reference, so the Assets
  // are collected first and freed once the Project is gone.
  const screenshots = await db.feedback.findMany({
    where: { projectId, screenshotId: { not: null } },
    select: { screenshotId: true },
  });

  await db.project.delete({ where: { id: projectId } });

  await deleteAssets(
    screenshots.flatMap(({ screenshotId }) =>
      screenshotId ? [screenshotId] : [],
    ),
  );

  return { id: projectId };
}
