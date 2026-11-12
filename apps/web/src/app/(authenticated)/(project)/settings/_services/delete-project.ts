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

  // The cascades only null each Asset reference, so the screenshots, the
  // Recordings and the Videos' file and Poster Assets are collected first and
  // freed once the Project is gone.
  const feedbackAssets = await db.feedback.findMany({
    where: {
      projectId,
      OR: [{ screenshotId: { not: null } }, { recordingId: { not: null } }],
    },
    select: { screenshotId: true, recordingId: true },
  });
  const videos = await db.video.findMany({
    where: { projectId },
    select: { fileAssetId: true, posterAssetId: true },
  });

  await db.project.delete({ where: { id: projectId } });

  await deleteAssets(
    [
      ...feedbackAssets.flatMap(({ screenshotId, recordingId }) => [
        screenshotId,
        recordingId,
      ]),
      ...videos.flatMap(({ fileAssetId, posterAssetId }) => [
        fileAssetId,
        posterAssetId,
      ]),
    ].filter((id): id is string => id !== null),
  );

  return { id: projectId };
}
