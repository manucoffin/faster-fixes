import { ConflictError } from "@/server/errors/domain-errors";
import { getProjectFeedback } from "./get-project-feedback";

type GetFeedbackAwaitingScreenshotInput = {
  feedbackId: string;
  projectId: string;
};

/**
 * The Feedback of a Project that may still take a screenshot. A Feedback that
 * already carries one is refused rather than overwritten: the stored Asset is
 * referenced by the Feedback alone, so a second upload would orphan it.
 *
 * Read before the request body is touched, so a Feedback that is unknown or
 * already illustrated answers without the upload ever being read.
 */
export async function getFeedbackAwaitingScreenshot({
  feedbackId,
  projectId,
}: GetFeedbackAwaitingScreenshotInput) {
  const feedback = await getProjectFeedback({ feedbackId, projectId });

  if (feedback.screenshotId) {
    // No period: this copy is the published widget API contract.
    throw new ConflictError("Screenshot already attached");
  }

  return feedback;
}

export type GetFeedbackAwaitingScreenshotOutput = Awaited<
  ReturnType<typeof getFeedbackAwaitingScreenshot>
>;
