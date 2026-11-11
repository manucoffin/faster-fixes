import {
  mergeDiagnosticTrail,
  mergeRecordingTimeline,
} from "@/app/_domains/feedback/_helpers/merge-recording-timeline";
import { refreshFeedbackRecordingSteps } from "@/server/recording/refresh-feedback-recording-steps";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { prisma } from "@workspace/db";
import type { GetRecordingPlaybackInput } from "./get-recording-playback.schema";

/**
 * What the inbox player needs for one Feedback's Recording: its duration, its
 * format version, its bounds on the clock and every entry of the merged
 * timeline, uncapped. The steps come from the agent surface's cache, so the
 * two never disagree. An unreadable file still answers, with the Diagnostic
 * Trail alone.
 */
export async function getRecordingPlayback(
  { feedbackId, userId }: GetRecordingPlaybackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      selector: true,
      metadata: true,
      diagnosticTrail: true,
      createdAt: true,
      recording: { select: { key: true } },
      recordingDurationMs: true,
      recordingFormatVersion: true,
      recordingSteps: true,
      recordingStepsVersion: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: feedback.project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const recording = await refreshFeedbackRecordingSteps(feedback, db);
  const formatVersion = feedback.recordingFormatVersion;
  if (!recording || formatVersion === null) {
    throw new NotFoundError("Recording not found.");
  }

  const diagnosticTrail = feedback.diagnosticTrail as DiagnosticTrail | null;
  const { steps, ...playback } = recording;
  return {
    ...playback,
    // The browser checks it before playing the file (#413).
    formatVersion,
    entries: playback.readable
      ? mergeRecordingTimeline({ steps, diagnosticTrail }).entries
      : // Without the file there is no Selection on the Recording's clock:
        // the entries are timed from the Feedback's creation.
        mergeDiagnosticTrail(diagnosticTrail, feedback.createdAt.getTime()),
  };
}

export type GetRecordingPlaybackOutput = Awaited<
  ReturnType<typeof getRecordingPlayback>
>;
