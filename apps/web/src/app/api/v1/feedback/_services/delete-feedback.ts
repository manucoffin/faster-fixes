import { prisma } from "@workspace/db";

type DeleteFeedbackInput = {
  feedbackId: string;
};

/**
 * Removes a Feedback the widget already resolved through `getProjectFeedback`,
 * so this write applies no access rule of its own.
 */
export async function deleteFeedback({ feedbackId }: DeleteFeedbackInput) {
  await prisma.feedback.delete({ where: { id: feedbackId } });
}
