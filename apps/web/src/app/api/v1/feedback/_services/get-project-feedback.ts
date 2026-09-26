import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

type GetProjectFeedbackInput = {
  feedbackId: string;
  projectId: string;
};

/**
 * One Feedback of a Project, read before the widget edits or deletes it. The
 * Project scope is the whole access rule: any active Reviewer of the Project
 * may act on any of its Feedback, not only on the ones they submitted.
 */
export async function getProjectFeedback({
  feedbackId,
  projectId,
}: GetProjectFeedbackInput) {
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, projectId },
  });

  if (!feedback) {
    // No period: this copy is the published widget API contract.
    throw new NotFoundError("Feedback not found");
  }

  return feedback;
}

export type GetProjectFeedbackOutput = Awaited<
  ReturnType<typeof getProjectFeedback>
>;
