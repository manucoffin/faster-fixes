import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";
import { generateShareLinkSecret } from "../_helpers/share-link-secret";
import type { ReplaceVideoShareLinkInput } from "./replace-video-share-link.schema";

/**
 * Gives a Video a new Share link secret. The old hash is overwritten, so the
 * previous link stops opening the review page at once.
 */
export async function replaceVideoShareLink(
  { videoId, userId }: ReplaceVideoShareLinkInput & { userId: string },
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

  const shareLink = generateShareLinkSecret();

  await db.video.update({
    where: { id: videoId },
    data: {
      shareTokenHash: shareLink.hash,
      shareTokenEncrypted: shareLink.encrypted,
    },
    select: { id: true },
  });

  return {
    id: videoId,
    shareUrl: `${getAppUrl()}/review/${encodeURIComponent(shareLink.secret)}`,
  };
}
