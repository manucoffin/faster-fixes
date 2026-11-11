import { prisma } from "@workspace/db";
import type { UpdateFeedbackRecordingInput } from "./update-feedback-recording.schema";

type UpdateFeedbackRecordingServiceInput = UpdateFeedbackRecordingInput & {
  feedbackId: string;
  /** The Asset `createFeedbackRecording` stored the file under. */
  recordingId: string;
};

export async function updateFeedbackRecording({
  feedbackId,
  recordingId,
  durationMs,
  formatVersion,
}: UpdateFeedbackRecordingServiceInput) {
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      recordingId,
      recordingDurationMs: durationMs,
      recordingFormatVersion: formatVersion,
    },
    select: { id: true },
  });
}
