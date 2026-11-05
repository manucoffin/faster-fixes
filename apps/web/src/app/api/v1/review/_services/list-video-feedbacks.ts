import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import {
  reviewFeedbackSelect,
  toReviewFeedbackItem,
} from "../_helpers/to-review-feedback-item";

/**
 * Every Feedback of the Video, resolved and archived included (the page hides
 * them behind a toggle), each with a Screenshot URL signed for one hour.
 */
export async function listVideoFeedbacks(videoId: string) {
  const feedbackList = await prisma.feedback.findMany({
    where: { videoId },
    orderBy: [{ startMs: "asc" }, { createdAt: "asc" }],
    select: reviewFeedbackSelect,
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
