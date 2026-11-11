import { z } from "zod";

import { RECORDING_STEPS_VERSION } from "./read-recording-steps";

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

export type CachedRecordingSteps = z.infer<typeof CachedRecordingStepsSchema>;

type FeedbackRecordingColumns = {
  recordingId: string | null;
  recordingDurationMs: number | null;
  recordingFormatVersion: number | null;
  recordingSteps: unknown;
  recordingStepsVersion: number | null;
};

/**
 * The cached steps of a Feedback's Recording, or `null` when none were cached
 * by the current derivation version.
 */
export function readCachedRecordingSteps({
  recordingSteps,
  recordingStepsVersion,
}: Pick<
  FeedbackRecordingColumns,
  "recordingSteps" | "recordingStepsVersion"
>): CachedRecordingSteps | null {
  if (recordingStepsVersion !== RECORDING_STEPS_VERSION) return null;
  const cached = CachedRecordingStepsSchema.safeParse(recordingSteps);
  return cached.success ? cached.data : null;
}

/**
 * What a listing says of a Feedback's Recording, from its columns alone: a
 * listing never reads a Recording file. `stepCount` is `null` until a request
 * for the single Feedback has cached the steps.
 */
export function summarizeFeedbackRecording(
  feedback: FeedbackRecordingColumns,
): { durationMs: number; stepCount: number | null } | null {
  const { recordingId, recordingDurationMs, recordingFormatVersion } = feedback;
  // Same presence rule as the single Feedback: a Recording not yet stored
  // reads as none.
  if (
    !recordingId ||
    recordingDurationMs === null ||
    recordingFormatVersion === null
  ) {
    return null;
  }
  return {
    durationMs: recordingDurationMs,
    stepCount: readCachedRecordingSteps(feedback)?.steps.length ?? null,
  };
}
