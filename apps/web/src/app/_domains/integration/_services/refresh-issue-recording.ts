import {
  mergeRecordingTimeline,
  RECORDING_TIMELINE_MAX_ENTRIES,
} from "@/app/_domains/feedback";
import {
  type FeedbackWithRecording,
  refreshFeedbackRecordingSteps,
} from "@/server/recording/refresh-feedback-recording-steps";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { prisma } from "@workspace/db";
import { buildFeedbackDashboardUrl } from "../_helpers/build-feedback-dashboard-url";
import type { IssueRecording } from "../_helpers/github/format-issue-body";

/**
 * What an Issue says of a Feedback's Recording: the player link, the duration
 * and the merged timeline, `null` when the file cannot be read. Steps come
 * from the cache when the derivation version matches and fill it otherwise.
 * `null` for a Feedback without a Recording or on a Video.
 */
export async function refreshIssueRecording(
  feedback: FeedbackWithRecording & {
    videoId: string | null;
    diagnosticTrail: unknown;
  },
  db: typeof prisma = prisma,
): Promise<IssueRecording | null> {
  if (feedback.videoId !== null) return null;
  const recording = await refreshFeedbackRecordingSteps(feedback, db);
  if (!recording) return null;

  return {
    playerUrl: buildFeedbackDashboardUrl(feedback, { player: true }),
    durationMs: recording.durationMs,
    timeline: recording.readable
      ? mergeRecordingTimeline({
          steps: recording.steps,
          diagnosticTrail: feedback.diagnosticTrail as DiagnosticTrail | null,
          maxEntries: RECORDING_TIMELINE_MAX_ENTRIES,
        })
      : null,
  };
}

export type RefreshIssueRecordingOutput = Awaited<
  ReturnType<typeof refreshIssueRecording>
>;
