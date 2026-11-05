import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import {
  UpdateVideoTitleSchema,
  type UpdateVideoTitleInput,
} from "./update-video-title.schema";

export async function updateVideoTitle(
  { videoId, title, userId }: UpdateVideoTitleInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // Parsed here too, so a caller other than the router gets the same bounds.
  const parsed = UpdateVideoTitleSchema.safeParse({ videoId, title });

  if (!parsed.success) {
    throw new BadRequestError(
      parsed.error.issues[0]?.message ?? "Enter a valid title.",
    );
  }

  const input = parsed.data;

  const video = await db.video.findUnique({
    where: { id: input.videoId },
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
    where: { id: input.videoId },
    data: { title: input.title },
    select: { id: true, title: true },
  });
}
