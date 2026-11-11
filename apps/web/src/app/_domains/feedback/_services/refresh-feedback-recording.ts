import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { z } from "zod";

import {
  RECORDING_STEPS_VERSION,
  readRecordingSteps,
} from "../_helpers/read-recording-steps";
import { getRecordingEvents } from "./get-recording-events";

const CachedRecordingStepsSchema = z.object({
  startedAt: z.number(),
  endedAt: z.number(),
  steps: z.array(
    z.object({
      type: z.enum([
        "load",
        "click",
        "input",
        "select",
        "submit",
        "navigation",
        "scroll",
        "resize",
        "selection",
      ]),
      timestamp: z.number(),
      offsetMs: z.number(),
      label: z.string().nullable(),
      selector: z.string().nullable(),
      detail: z.string().nullable(),
    }),
  ),
});

type CachedRecordingSteps = z.infer<typeof CachedRecordingStepsSchema>;

type FeedbackWithRecording = {
  id: string;
  selector: string | null;
  metadata: unknown;
  recording: { key: string } | null;
  recordingDurationMs: number | null;
  recordingFormatVersion: number | null;
  recordingSteps: unknown;
  recordingStepsVersion: number | null;
};

/**
 * A Feedback's Recording as the agent surface hands it out: its steps, from
 * the cache when the derivation version matches, otherwise read from the file
 * and cached. `null` when no Recording has reached the server. An unreadable
 * file never throws: it answers `readable: false` with no steps.
 */
export async function refreshFeedbackRecording(
  feedback: FeedbackWithRecording,
  db: typeof prisma = prisma,
) {
  const {
    recording,
    recordingDurationMs: durationMs,
    recordingFormatVersion: formatVersion,
  } = feedback;
  if (!recording || durationMs === null || formatVersion === null) {
    return null;
  }

  const url = await getSignedAssetUrl(recording);
  const derived =
    readCache(feedback) ??
    (await deriveAndCache(feedback, recording, formatVersion, db));

  if (!derived) {
    return {
      durationMs,
      startedAt: null,
      endedAt: null,
      url,
      readable: false as const,
      steps: [],
    };
  }
  return { durationMs, ...derived, url, readable: true as const };
}

export type RefreshFeedbackRecordingOutput = Awaited<
  ReturnType<typeof refreshFeedbackRecording>
>;

function readCache({
  recordingSteps,
  recordingStepsVersion,
}: FeedbackWithRecording): CachedRecordingSteps | null {
  if (recordingStepsVersion !== RECORDING_STEPS_VERSION) return null;
  const cached = CachedRecordingStepsSchema.safeParse(recordingSteps);
  return cached.success ? cached.data : null;
}

async function deriveAndCache(
  feedback: FeedbackWithRecording,
  recording: { key: string },
  formatVersion: number,
  db: typeof prisma,
): Promise<CachedRecordingSteps | null> {
  const file = await getRecordingEvents(recording);
  if (!file.readable) return null;

  const elementDescription = (
    feedback.metadata as Record<string, unknown> | null
  )?.elementDescription;
  const result = readRecordingSteps({
    formatVersion,
    events: file.events,
    selection: {
      label: typeof elementDescription === "string" ? elementDescription : null,
      selector: feedback.selector,
    },
  });
  if (!result.readable) return null;

  const derived = {
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    steps: result.steps,
  };
  // Only a readable result is cached: a missing object may yet appear.
  try {
    await db.feedback.update({
      where: { id: feedback.id },
      data: {
        recordingSteps: derived,
        recordingStepsVersion: RECORDING_STEPS_VERSION,
      },
      select: { id: true },
    });
  } catch (error) {
    // The cache only saves work: a failed write still answers the steps.
    console.error(
      `Failed to cache Recording steps (feedbackId=${feedback.id}):`,
      error,
    );
  }
  return derived;
}
