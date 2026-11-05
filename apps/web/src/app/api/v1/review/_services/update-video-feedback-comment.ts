import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import {
  reviewFeedbackSelect,
  toReviewFeedbackItem,
} from "../_helpers/to-review-feedback-item";

type UpdateVideoFeedbackCommentInput = {
  feedbackId: string;
  comment: string;
};

/**
 * Rewrites the comment of a Feedback the route already resolved through
 * `findOwnNewVideoFeedback`, so this write applies no access rule of its own.
 */
export async function updateVideoFeedbackComment({
  feedbackId,
  comment,
}: UpdateVideoFeedbackCommentInput) {
  const { screenshot, ...row } = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { comment },
    select: reviewFeedbackSelect,
  });

  return toReviewFeedbackItem(
    row,
    screenshot ? await getSignedAssetUrl(screenshot) : null,
  );
}

export type UpdateVideoFeedbackCommentOutput = Awaited<
  ReturnType<typeof updateVideoFeedbackComment>
>;
