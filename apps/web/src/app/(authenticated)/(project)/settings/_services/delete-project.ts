import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAssets } from "@/server/storage/delete-assets";
import { prisma } from "@workspace/db";
import type { DeleteProjectInput } from "./delete-project.schema";

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

  // The cascades only null each Asset reference, so the screenshots and the
  // Videos' file and Poster Assets are collected first and freed once the
  // Project is gone.
  const screenshots = await db.feedback.findMany({
    where: { projectId, screenshotId: { not: null } },
    select: { screenshotId: true },
  });
  const videos = await db.video.findMany({
    where: { projectId },
    select: { fileAssetId: true, posterAssetId: true },
  });

  await db.project.delete({ where: { id: projectId } });

  await deleteAssets(
    [
      ...screenshots.map(({ screenshotId }) => screenshotId),
      ...videos.flatMap(({ fileAssetId, posterAssetId }) => [
        fileAssetId,
        posterAssetId,
      ]),
    ].filter((id): id is string => id !== null),
  );

  return { id: projectId };
}
