import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateVideoAnnotationsOpenInput } from "./update-video-annotations-open.schema";

/**
 * Opens or closes a Video to new Feedback from its review page. Closed keeps
 * the link working for playback and reading.
 */
export async function updateVideoAnnotationsOpen(
  {
    videoId,
    open,
    userId,
  }: UpdateVideoAnnotationsOpenInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: { project: { select: { organizationId: true } } },
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

  return db.video.update({
    where: { id: videoId },
    data: { annotationsOpen: open },
    select: { id: true, annotationsOpen: true },
  });
}
