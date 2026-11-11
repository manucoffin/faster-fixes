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

  // The relations only null the references, so the screenshot and Recording
  // Assets and their stored objects would outlive the Feedback.
  for (const assetId of [feedback.screenshotId, feedback.recordingId]) {
    if (assetId) await deleteAsset(assetId);
  }
}
