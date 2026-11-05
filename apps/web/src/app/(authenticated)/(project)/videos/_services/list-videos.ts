import { decryptShareLinkSecret } from "@/app/_domains/video/_helpers/share-link-secret";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";
import type { ListVideosInput } from "./list-videos.schema";

const OPEN_STATUSES = ["new", "in_progress"];

/** The Project's Videos, newest first, as the Videos list shows them. */
export async function listVideos(
  { projectId, userId }: ListVideosInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this project.");
  }

  const videos = await db.video.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      state: true,
      durationMs: true,
      size: true,
      annotationsOpen: true,
      createdAt: true,
      shareTokenEncrypted: true,
      posterAsset: { select: { key: true } },
      uploadedBy: { select: { name: true } },
      _count: {
        select: { feedback: { where: { status: { in: OPEN_STATUSES } } } },
      },
    },
  });

  const appUrl = getAppUrl();

  return Promise.all(
    videos.map(async (video) => ({
      id: video.id,
      title: video.title,
      state: video.state,
      durationMs: video.durationMs,
      // A BigInt does not cross the JSON transport, and no file nears 2^53.
      size: Number(video.size),
      posterUrl: video.posterAsset
        ? await getSignedAssetUrl(video.posterAsset)
        : null,
      openFeedbackCount: video._count.feedback,
      annotationsOpen: video.annotationsOpen,
      uploadedBy: video.uploadedBy?.name ?? null,
      createdAt: video.createdAt,
      shareUrl: getShareUrl(appUrl, video.shareTokenEncrypted),
    })),
  );
}

// A secret encrypted under a since-rotated auth secret no longer decrypts:
// the link still works for its holders, the dashboard just cannot show it.
function getShareUrl(appUrl: string, shareTokenEncrypted: string) {
  try {
    const secret = decryptShareLinkSecret(shareTokenEncrypted);
    return `${appUrl}/review/${encodeURIComponent(secret)}`;
  } catch {
    return null;
  }
}

export type ListVideosOutput = Awaited<ReturnType<typeof listVideos>>;
