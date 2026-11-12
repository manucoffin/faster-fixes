import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { deleteAsset } from "@/server/storage/delete-asset";
import { prisma } from "@workspace/db";
import { Prisma } from "@workspace/db/types";
import type { DeleteFeedbackRecordingInput } from "./delete-feedback-recording.schema";

/**
 * Removes a Feedback's Recording and keeps the Feedback (ADR-0022). Unlike
 * deleting a Feedback, it is open on any Status. Nothing is sent to Trackers
 * or Notification channels.
 */
export async function deleteFeedbackRecording(
  { feedbackId, userId }: DeleteFeedbackRecordingInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      recordingId: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: feedback.project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  if (!feedback.recordingId) {
    throw new NotFoundError("Recording not found.");
  }

  // Cleared before the Asset goes, so the Feedback reads as one without a
  // Recording even if freeing the Asset fails halfway.
  await db.feedback.update({
    where: { id: feedbackId },
    data: {
      recordingId: null,
      recordingDurationMs: null,
      recordingFormatVersion: null,
      recordingSteps: Prisma.DbNull,
      recordingStepsVersion: null,
    },
    select: { id: true },
  });

  await deleteAsset(feedback.recordingId, db);

  return { id: feedbackId };
}
