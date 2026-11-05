import {
  inboxFeedbackInclude,
  toInboxFeedbackItem,
} from "@/app/(authenticated)/(project)/inbox/_services/_inbox-feedback-projection";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";
import { toVideoRow, videoRowSelect } from "../../_services/_video-row";
import type { GetVideoInput } from "./get-video.schema";

/**
 * A Video as its dashboard page shows it: the list row, a playback URL, and
 * its Feedback in the inbox projection, ordered by in point, so the detail
 * Sheet takes an item as is.
 */
export async function getVideo(
  { videoId, userId }: GetVideoInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      ...videoRowSelect,
      projectId: true,
      width: true,
      height: true,
      fileAsset: { select: { key: true } },
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

  const [row, playbackUrl, feedback] = await Promise.all([
    toVideoRow(video, getAppUrl()),
    // An `uploading` Video has no file to play yet.
    video.fileAsset ? getSignedAssetUrl(video.fileAsset) : null,
    db.feedback.findMany({
      where: { videoId },
      orderBy: [{ startMs: "asc" }, { createdAt: "asc" }],
      include: inboxFeedbackInclude,
    }),
  ]);

  return {
    ...row,
    projectId: video.projectId,
    width: video.width,
    height: video.height,
    playbackUrl,
    feedback: await Promise.all(feedback.map(toInboxFeedbackItem)),
  };
}

export type GetVideoOutput = Awaited<ReturnType<typeof getVideo>>;
