import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { toReviewFeedbackItem } from "../_helpers/to-review-feedback-item";

/**
 * Every Feedback of the Video, resolved and archived included (the page hides
 * them behind a toggle), each with a Screenshot URL signed for one hour.
 */
export async function listVideoFeedbacks(videoId: string) {
  const feedbackList = await prisma.feedback.findMany({
    where: { videoId },
    orderBy: [{ startMs: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      comment: true,
      pageUrl: true,
      clickX: true,
      clickY: true,
      selector: true,
      metadata: true,
      createdAt: true,
      startMs: true,
      endMs: true,
      frameX: true,
      frameY: true,
      frameWidth: true,
      frameHeight: true,
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true } },
    },
  });

  return Promise.all(
    feedbackList.map(async ({ screenshot, ...row }) =>
      toReviewFeedbackItem(
        row,
        screenshot ? await getSignedAssetUrl(screenshot) : null,
      ),
    ),
  );
}

export type ListVideoFeedbacksOutput = Awaited<
  ReturnType<typeof listVideoFeedbacks>
>;
