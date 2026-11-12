import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "@/server/errors/domain-errors";
import { getProjectFeedback } from "./get-project-feedback";

type GetFeedbackAwaitingRecordingInput = {
  feedbackId: string;
  projectId: string;
  reviewerId: string;
};

/**
 * The page Feedback of a Project that may still take a Recording. Tighter than
 * the Screenshot: only the Reviewer who created the Feedback may attach one,
 * since the Recording is a copy of their own page session.
 *
 * Read before the request body is touched, so a refused upload is never read.
 */
export async function getFeedbackAwaitingRecording({
  feedbackId,
  projectId,
  reviewerId,
}: GetFeedbackAwaitingRecordingInput) {
  const feedback = await getProjectFeedback({ feedbackId, projectId });

  if (feedback.reviewerId !== reviewerId) {
    throw new ForbiddenError("Feedback belongs to another reviewer");
  }

  // A Recording is fixed at creation: a second upload would orphan the first.
  if (feedback.recordingId) {
    throw new ConflictError("Recording already attached");
  }

  if (feedback.videoId) {
    throw new BadRequestError("Recording is only for a page feedback");
  }

  return feedback;
}

export type GetFeedbackAwaitingRecordingOutput = Awaited<
  ReturnType<typeof getFeedbackAwaitingRecording>
>;
