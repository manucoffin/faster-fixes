import {
  formatConsoleEntry,
  formatNetworkEntry,
} from "./format-diagnostic-entry";
import type {
  RecordingTimeline,
  RecordingTimelineEntry,
} from "./merge-recording-timeline";
import type { RecordingStep } from "./read-recording-steps";

/**
 * Render a merged timeline as markdown lines: what was left out first, then
 * one bullet per entry with its time from the Selection. Returns `[]` for an
 * empty timeline, like `formatDiagnosticTrailLines`.
 */
export function formatTimelineLines({
  entries,
  droppedCount,
  afterSelectionCount,
}: RecordingTimeline): string[] {
  if (entries.length === 0) return [];
  const notes = [
    droppedCount > 0
      ? `${droppedCount} earlier ${entriesNoun(droppedCount)} omitted.`
      : null,
    afterSelectionCount > 0
      ? `${afterSelectionCount} ${entriesNoun(afterSelectionCount)} after the Selection omitted.`
      : null,
  ].filter((note) => note !== null);

  return [
    ...notes,
    ...(notes.length > 0 ? [""] : []),
    ...entries.map(
      (entry) => `- ${formatOffset(entry.offsetMs)}  ${formatEntry(entry)}`,
    ),
  ];
}

function formatEntry(entry: RecordingTimelineEntry): string {
  if (entry.kind === "console") return formatConsoleEntry(entry.entry);
  if (entry.kind === "network") return formatNetworkEntry(entry.entry);
  return formatStep(entry.step);
}

function formatStep({ type, label, selector, detail }: RecordingStep): string {
  // The label of the opening step is its wording; the detail is where from.
  if (type === "load") return detail ? `${label}, from ${detail}` : `${label}`;
  const parts = [type, label, selector ? `(${selector})` : null, detail].filter(
    (part) => part !== null,
  );
  const line = parts.join(" ");
  return type === "selection"
    ? `${line}, the element the comment is about`
    : line;
}

function formatOffset(offsetMs: number): string {
  const seconds = Math.round(offsetMs / 100) / 10;
  // Rounding a few milliseconds before the Selection gives -0.
  return `${(seconds === 0 ? 0 : seconds).toFixed(1)} s`;
}

function entriesNoun(count: number): string {
  return count === 1 ? "entry" : "entries";
}
