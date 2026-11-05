import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAssets } from "@/server/storage/delete-assets";
import { prisma } from "@workspace/db";
import type { DeleteVideoInput } from "./delete-video.schema";

/**
 * Deletes a Video for good, in either state. Its Feedback, Reviewers and their
 * Issue links cascade with the row; Tracker Issues and Slack messages already
 * created stay where they are.
 */
export async function deleteVideo(
  { videoId, userId }: DeleteVideoInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      fileAssetId: true,
      posterAssetId: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!video) {
    throw new NotFoundError("Video not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: video.project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this project.");
  }

  // The cascades only null each Asset reference, so the ids are collected
  // first and freed once the Video is gone.
  const screenshots = await db.feedback.findMany({
    where: { videoId, screenshotId: { not: null } },
    select: { screenshotId: true },
  });

  await db.video.delete({ where: { id: videoId } });

  await deleteAssets(
    [
      video.fileAssetId,
      video.posterAssetId,
      ...screenshots.map(({ screenshotId }) => screenshotId),
    ].filter((id): id is string => id !== null),
  );

  return { id: videoId };
}
