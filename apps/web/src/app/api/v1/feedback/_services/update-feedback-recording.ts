import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackRecordingAttachedEvent,
} from "@/server/inngest/events";
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

  // Fire-and-forget: a failed send never fails the upload, and an automatic
  // Issue held back for this Recording goes out at the end of its delay.
  inngest
    .send(buildEvent(feedbackRecordingAttachedEvent, { feedbackId }))
    .catch(() => {});
}
