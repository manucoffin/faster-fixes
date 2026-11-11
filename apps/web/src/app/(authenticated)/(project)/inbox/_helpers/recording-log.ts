import type { RecordingTimelineEntry } from "@/app/_domains/feedback/_helpers/merge-recording-timeline";

// The log beside the player: the merged timeline entries, placed on the
// player's clock, which counts milliseconds from the start of the Recording.

export const RECORDING_LOG_SOURCES = ["step", "console", "network"] as const;

export type RecordingLogSource = (typeof RECORDING_LOG_SOURCES)[number];

/** The entries of the sources that are on, in their order. */
export function filterRecordingLog(
  entries: readonly RecordingTimelineEntry[],
  hidden: ReadonlySet<RecordingLogSource>,
): RecordingTimelineEntry[] {
  return entries.filter((entry) => !hidden.has(entry.kind));
}

/**
 * The index of the last entry at or before the playhead, `-1` when the
 * playhead is before the first entry or there is no clock to place it on.
 */
export function findCurrentLogEntry(
  entries: readonly RecordingTimelineEntry[],
  clock: RecordingLogClock | null,
  time: number,
): number {
  if (!clock) return -1;
  const at = clock.startedAt + time;
  let current = -1;
  // The entries are in time order.
  for (const [index, entry] of entries.entries()) {
    if (entry.timestamp > at) break;
    current = index;
  }
  return current;
}

export type RecordingLogClock = {
  /** Epoch milliseconds of the Recording's first event. */
  startedAt: number;
  durationMs: number;
};

/**
 * Where an entry sits on the player's clock. An entry logged before the
 * Recording started sits at its start.
 */
export function recordingLogTime(
  entry: RecordingTimelineEntry,
  { startedAt, durationMs }: RecordingLogClock,
): number {
  return Math.min(durationMs, Math.max(0, entry.timestamp - startedAt));
}
