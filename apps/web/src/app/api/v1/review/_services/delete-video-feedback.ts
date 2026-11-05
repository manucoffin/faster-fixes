import { deleteAsset } from "@/server/storage/delete-asset";
import { prisma } from "@workspace/db";

/**
 * Removes a Feedback the route already resolved through
 * `findOwnNewVideoFeedback`. Unlike the dashboard, which deletes archived
 * Feedback only, this is a Reviewer withdrawing their own new Feedback.
 */
export async function deleteVideoFeedback({
  feedbackId,
}: {
  feedbackId: string;
}) {
  const feedback = await prisma.feedback.delete({
    where: { id: feedbackId },
    select: { screenshotId: true },
  });

  // The relation only nulls the reference, so the Screenshot Asset and its
  // stored object would outlive the Feedback.
  if (feedback.screenshotId) {
    await deleteAsset(feedback.screenshotId);
  }
}
