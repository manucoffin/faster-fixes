import { deleteAsset } from "@/server/storage/delete-asset";
import { prisma } from "@workspace/db";

type DeleteFeedbackInput = {
  feedbackId: string;
};

/**
 * Removes a Feedback the widget already resolved through `getProjectFeedback`,
 * so this write applies no access rule of its own.
 */
export async function deleteFeedback({ feedbackId }: DeleteFeedbackInput) {
  const feedback = await prisma.feedback.delete({ where: { id: feedbackId } });

  // The relation only nulls the reference, so the screenshot Asset and its S3
  // object would outlive the Feedback.
  if (feedback.screenshotId) {
    await deleteAsset(feedback.screenshotId);
  }
}
