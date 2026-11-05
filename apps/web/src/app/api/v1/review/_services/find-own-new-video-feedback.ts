import { prisma } from "@workspace/db";

type FindOwnNewVideoFeedbackInput = {
  feedbackId: string;
  videoId: string;
  reviewerId: string;
};

/**
 * The Feedback a Reviewer may still edit or withdraw through the Share link:
 * on this Video, theirs, and `new`. Null in every other case, so the caller
 * answers the same 404 whether the Feedback is missing, someone else's or
 * already moved on, and ownership is not disclosed.
 */
export async function findOwnNewVideoFeedback({
  feedbackId,
  videoId,
  reviewerId,
}: FindOwnNewVideoFeedbackInput) {
  return prisma.feedback.findFirst({
    where: { id: feedbackId, videoId, reviewerId, status: "new" },
    select: { id: true, screenshotId: true },
  });
}

export type FindOwnNewVideoFeedbackOutput = Awaited<
  ReturnType<typeof findOwnNewVideoFeedback>
>;
