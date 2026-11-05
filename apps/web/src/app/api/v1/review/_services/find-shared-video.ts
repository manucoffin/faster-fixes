import { hashShareLinkSecret } from "@/app/_domains/video/_helpers/share-link-secret";
import { prisma } from "@workspace/db";

/**
 * The Video a Share link secret opens, or null when no Video holds it (unknown,
 * replaced or deleted link) or the Video is not `ready` to play.
 */
export async function findSharedVideo(secret: string) {
  const video = await prisma.video.findFirst({
    where: { shareTokenHash: hashShareLinkSecret(secret), state: "ready" },
    select: {
      id: true,
      projectId: true,
      title: true,
      durationMs: true,
      width: true,
      height: true,
      annotationsOpen: true,
      fileAsset: { select: { key: true } },
      posterAsset: { select: { key: true } },
      project: { select: { organizationId: true } },
    },
  });

  // A ready Video whose file Asset is gone has nothing left to play.
  if (!video?.fileAsset) return null;
  return { ...video, fileAsset: video.fileAsset };
}

export type FindSharedVideoOutput = Awaited<ReturnType<typeof findSharedVideo>>;
