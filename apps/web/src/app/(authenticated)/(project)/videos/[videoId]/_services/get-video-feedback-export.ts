import {
  toAgentFeedbackItem,
  toAgentVideoBlock,
} from "@/app/_domains/feedback/_helpers/agent-feedback-serializer";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import type { GetVideoFeedbackExportInput } from "./get-video-feedback-export.schema";

/**
 * Every Feedback of a Video, of every Status, as the document the agent API
 * returns for a listing filtered on that Video: the `video` block first.
 */
export async function getVideoFeedbackExport(
  { videoId, userId }: GetVideoFeedbackExportInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const video = await db.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      filename: true,
      durationMs: true,
      width: true,
      height: true,
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

  const feedbacks = await db.feedback.findMany({
    where: { videoId },
    orderBy: [{ startMs: "asc" }, { createdAt: "asc" }],
    include: {
      reviewer: { select: { name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  const items = await Promise.all(
    feedbacks.map(async (f) =>
      toAgentFeedbackItem(
        f,
        f.screenshot ? await getSignedAssetUrl(f.screenshot) : null,
      ),
    ),
  );

  return {
    video: toAgentVideoBlock(video),
    feedbacks: items,
    count: items.length,
  };
}

export type GetVideoFeedbackExportOutput = Awaited<
  ReturnType<typeof getVideoFeedbackExport>
>;
