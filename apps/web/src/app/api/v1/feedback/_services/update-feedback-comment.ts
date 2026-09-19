import { prisma } from "@workspace/db";

type UpdateFeedbackCommentInput = {
  feedbackId: string;
  comment: string;
};

/**
 * Rewrites the comment of a Feedback the widget already resolved through
 * `getProjectFeedback`, so this write applies no access rule of its own.
 */
export async function updateFeedbackComment({
  feedbackId,
  comment,
}: UpdateFeedbackCommentInput) {
  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { comment },
  });

  return {
    id: updated.id,
    comment: updated.comment,
    updatedAt: updated.updatedAt,
  };
}

export type UpdateFeedbackCommentOutput = Awaited<
  ReturnType<typeof updateFeedbackComment>
>;
