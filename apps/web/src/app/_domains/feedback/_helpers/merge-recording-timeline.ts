import type {
  ConsoleEntry,
  DiagnosticTrail,
  NetworkEntry,
} from "@fasterfixes/core";

import type { RecordingStep } from "./read-recording-steps";

// Steps and the Diagnostic Trail on one clock, as structured entries: every
// surface that shows the timeline renders these to its own format.

// Provisional: the target is one Feedback's whole markdown under 10,000
// tokens, to be calibrated by hand on real Recordings. Selection included.
export const RECORDING_TIMELINE_MAX_ENTRIES = 120;

type Timed = {
  /** Epoch milliseconds; a network entry sits at the start of its request. */
  timestamp: number;
  /** Zero or negative, relative to the Selection. */
  offsetMs: number;
};

export type RecordingTimelineEntry =
  | (Timed & { kind: "step"; step: RecordingStep })
  | (Timed & { kind: "console"; entry: ConsoleEntry })
  | (Timed & { kind: "network"; entry: NetworkEntry });

export type RecordingTimeline = {
  /** In time order, ending with the Selection. */
  entries: RecordingTimelineEntry[];
  /** Entries left out by the cap, from the start of the timeline. */
  droppedCount: number;
  /** Diagnostic Trail entries logged while the Reviewer wrote the comment. */
  afterSelectionCount: number;
};

/**
 * Merge a Recording's steps, which end with the Selection, with the Diagnostic
 * Trail in time order. With `maxEntries`, capped so the entries closest to the
 * Selection stay; console errors and failed network responses survive the cut
 * first. Without it, every entry up to the Selection is returned.
 */
export function mergeRecordingTimeline({
  steps,
  diagnosticTrail,
  maxEntries = Infinity,
}: {
  steps: readonly RecordingStep[];
  diagnosticTrail: DiagnosticTrail | null | undefined;
  /** Selection included. */
  maxEntries?: number;
}): RecordingTimeline {
  const selection = steps.at(-1);
  if (!selection) {
    return { entries: [], droppedCount: 0, afterSelectionCount: 0 };
  }
  const at = (timestamp: number) => ({
    timestamp,
    offsetMs: timestamp - selection.timestamp,
  });

  // Concatenated steps first, so a sort tie puts the action before its effect.
  const all: RecordingTimelineEntry[] = [
    ...steps
      .slice(0, -1)
      .map((step) => ({ kind: "step" as const, step, ...at(step.timestamp) })),
    ...diagnosticTrailEntries(diagnosticTrail, selection.timestamp),
  ];
  const before = all
    .filter((entry) => entry.offsetMs <= 0)
    .sort((a, b) => a.timestamp - b.timestamp);
  const kept = keepClosest(before, maxEntries - 1);

  return {
    entries: [
      ...kept,
      { kind: "step", step: selection, ...at(selection.timestamp) },
    ],
    droppedCount: before.length - kept.length,
    afterSelectionCount: all.length - before.length,
  };
}

/**
 * The Diagnostic Trail alone as timeline entries, in time order, timed from
 * `referenceAt`: what a timeline holds when a Recording cannot be read.
 */
export function mergeDiagnosticTrail(
  diagnosticTrail: DiagnosticTrail | null | undefined,
  referenceAt: number,
): RecordingTimelineEntry[] {
  return diagnosticTrailEntries(diagnosticTrail, referenceAt).sort(
    (a, b) => a.timestamp - b.timestamp,
  );
}

function diagnosticTrailEntries(
  diagnosticTrail: DiagnosticTrail | null | undefined,
  referenceAt: number,
): RecordingTimelineEntry[] {
  const at = (timestamp: number) => ({
    timestamp,
    offsetMs: timestamp - referenceAt,
  });
  return [
    ...(diagnosticTrail?.network ?? []).map((entry) => ({
      kind: "network" as const,
      entry,
      ...at(entry.timestamp),
    })),
    ...(diagnosticTrail?.console ?? []).map((entry) => ({
      kind: "console" as const,
      entry,
      ...at(entry.timestamp),
    })),
  ];
}

// Fills the budget with evidence first, then with the rest, latest first.
function keepClosest(
  entries: RecordingTimelineEntry[],
  budget: number,
): RecordingTimelineEntry[] {
  if (entries.length <= budget) return entries;
  const latestFirst = [...entries].reverse();
  const kept = new Set(latestFirst.filter(isEvidence).slice(0, budget));
  for (const entry of latestFirst) {
    if (kept.size >= budget) break;
    kept.add(entry);
  }
  return entries.filter((entry) => kept.has(entry));
}

function isEvidence(entry: RecordingTimelineEntry): boolean {
  if (entry.kind === "console") return entry.entry.level === "error";
  if (entry.kind === "network") {
    return entry.entry.status === 0 || entry.entry.status >= 400;
  }
  return false;
}
