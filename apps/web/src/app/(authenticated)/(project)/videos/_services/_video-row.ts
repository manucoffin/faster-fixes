import { decryptShareLinkSecret } from "@/app/_domains/video/_helpers/share-link-secret";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import type { Prisma } from "@workspace/db/types";

// A Video as the Videos list shows it, shared with the Video page, which
// extends the same row.

const OPEN_STATUSES = ["new", "in_progress"];

export const videoRowSelect = {
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
} satisfies Prisma.VideoSelect;

type VideoRow = Prisma.VideoGetPayload<{ select: typeof videoRowSelect }>;

export async function toVideoRow(video: VideoRow, appUrl: string) {
  return {
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
  };
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
