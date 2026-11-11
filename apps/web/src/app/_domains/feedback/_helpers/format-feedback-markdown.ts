/**
 * Shared markdown formatter for feedback items.
 * Used by both the dashboard export and the agent API.
 */

import { describeVideoSelection } from "@/app/_domains/video";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";
import {
  collapseWhitespace,
  formatConsoleEntry,
  formatNetworkEntry,
} from "./format-diagnostic-entry";
import { formatTimelineLines } from "./format-timeline-lines";
import { mergeRecordingTimeline } from "./merge-recording-timeline";
import type { FeedbackSelection } from "./read-feedback-selection";
import type { RecordingStep } from "./read-recording-steps";

export type FeedbackForMarkdown = {
  id: string;
  status: string;
  comment: string;
  pageUrl: string | null;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  screenshotUrl: string | null;
  metadata: Record<string, unknown> | null;
  // Optional: the dashboard's lean list query doesn't load it; the agent API and
  // issue creators do. Absent → the Diagnostics section is skipped.
  diagnosticTrail?: DiagnosticTrail | null;
  // Optional for the same reason: absent or empty → the section is skipped.
  customMetadata?: CustomMetadata | null;
  // Optional: absent or null on a page Feedback (ADR-0020).
  videoId?: string | null;
  videoTitle?: string | null;
  selection?: FeedbackSelection | null;
  // Optional: only the single Feedback reads its Recording. Readable → the
  // Timeline takes the place of Diagnostics.
  recording?: { readable: boolean; steps: RecordingStep[] } | null;
};

// A listing never carries a timeline: only that a Recording exists, how long
// it is and how many steps are cached, from the Feedback's columns.
export type FeedbackListItemForMarkdown = Omit<
  FeedbackForMarkdown,
  "recording"
> & {
  recording?: { durationMs: number; stepCount: number | null } | null;
};

export function formatFeedbackAsMarkdown(f: FeedbackForMarkdown): string {
  return renderFeedbackMarkdown(f, diagnosticsOrTimelineLines(f));
}

/** One Feedback in list form: Diagnostics as today, plus the Recording line. */
export function formatFeedbackListItemAsMarkdown(
  f: FeedbackListItemForMarkdown,
): string {
  const lines = diagnosticsOrTimelineLines({
    diagnosticTrail: f.diagnosticTrail,
  });
  if (f.recording) {
    // A Console-only trail already ends on a blank line.
    if (lines.at(-1) !== "") lines.push("");
    lines.push(formatRecordingListLine(f.id, f.recording));
  }
  return renderFeedbackMarkdown(f, lines);
}

function formatRecordingListLine(
  feedbackId: string,
  { durationMs, stepCount }: { durationMs: number; stepCount: number | null },
): string {
  const duration = `${(durationMs / 1000).toFixed(1)} s`;
  const summary =
    stepCount === null
      ? duration
      : `${duration}, ${stepCount} ${stepCount === 1 ? "step" : "steps"}`;
  return `**Recording:** ${summary}. Call \`get_feedback\` with id \`${feedbackId}\` to read its timeline.`;
}

function renderFeedbackMarkdown(
  f: Omit<FeedbackForMarkdown, "recording">,
  diagnosticsLines: string[],
): string {
  const md = f.metadata;
  const lines: string[] = [];

  lines.push(`# Feedback ${f.id}`);
  lines.push("");
  lines.push(`**Status:** ${f.status}`);
  lines.push("");
  lines.push(
    "A user left feedback on your application. Review and address the issue described below.",
  );

  // Where to look — most actionable info first
  const locationLines: string[] = f.videoId ? videoLocationLines(f) : [];
  if (f.pageUrl) locationLines.push(`**Page URL:** ${f.pageUrl}`);
  if (typeof md?.reactComponentPath === "string" && md.reactComponentPath) {
    locationLines.push(`**Component tree:** \`${md.reactComponentPath}\``);
  }
  if (typeof md?.sourceFile === "string" && md.sourceFile) {
    locationLines.push(`**Source file:** \`${md.sourceFile}\``);
  }
  if (f.selector) locationLines.push(`**DOM selector:** \`${f.selector}\``);
  if (typeof md?.elementDescription === "string" && md.elementDescription) {
    locationLines.push(`**Element:** ${md.elementDescription}`);
  }

  if (locationLines.length > 0) {
    lines.push("");
    lines.push("## Where to look");
    lines.push("");
    lines.push(...locationLines);
  }

  // What's wrong — the user's description as a blockquote
  lines.push("");
  lines.push("## What's wrong");
  lines.push("");
  const quotedComment = f.comment
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  lines.push(quotedComment);

  if (typeof md?.nearbyText === "string" && md.nearbyText) {
    lines.push("");
    lines.push(`**Nearby text:** "${md.nearbyText}"`);
  }

  // Environment — only if there's something to show
  const envLines: string[] = [];
  if (f.browserName) {
    envLines.push(
      `**Browser:** ${f.browserName}${f.browserVersion ? ` ${f.browserVersion}` : ""}`,
    );
  }
  if (f.os) envLines.push(`**OS:** ${f.os}`);
  if (f.viewportWidth && f.viewportHeight) {
    envLines.push(`**Viewport:** ${f.viewportWidth}\u00d7${f.viewportHeight}`);
  }

  if (envLines.length > 0) {
    lines.push("");
    lines.push("## Environment");
    lines.push("");
    lines.push(...envLines);
  }

  const customMetadataLines = formatCustomMetadataLines(f.customMetadata);
  if (customMetadataLines.length > 0) {
    lines.push("");
    lines.push("## Custom metadata");
    lines.push("");
    lines.push(...customMetadataLines);
  }

  lines.push(...diagnosticsLines);

  // Screenshot with instruction for multimodal AI agents
  if (f.screenshotUrl) {
    lines.push("");
    lines.push("## Screenshot");
    lines.push("");
    lines.push(
      "Examine this screenshot for visual context of the reported feedback:",
    );
    lines.push(`![Feedback screenshot](${f.screenshotUrl})`);
  }

  return lines.join("\n");
}

// The Timeline already holds the Diagnostic Trail's entries, on one clock with
// the Reviewer's steps; Diagnostics stays when there is no readable Recording.
function diagnosticsOrTimelineLines({
  recording,
  diagnosticTrail,
}: Pick<FeedbackForMarkdown, "recording" | "diagnosticTrail">): string[] {
  if (recording?.readable) {
    const timelineLines = formatTimelineLines(
      mergeRecordingTimeline({ steps: recording.steps, diagnosticTrail }),
    );
    if (timelineLines.length > 0) {
      return ["", "## Timeline", "", ...timelineLines];
    }
  }

  const lines: string[] = [];
  const diagnosticLines = formatDiagnosticTrailLines(diagnosticTrail);
  if (diagnosticLines.length > 0) {
    lines.push("", "## Diagnostics", "", ...diagnosticLines);
  }
  if (recording && !recording.readable) {
    // A Console-only trail already ends on a blank line.
    if (lines.at(-1) !== "") lines.push("");
    lines.push(
      "**Recording:** the file could not be read, so this Feedback has no timeline.",
    );
  }
  return lines;
}

function videoLocationLines({
  videoTitle,
  selection,
}: Pick<FeedbackForMarkdown, "videoTitle" | "selection">) {
  const lines: string[] = [];
  if (videoTitle) lines.push(`**Video:** ${videoTitle}`);
  if (!selection) return lines;

  lines.push(`**When:** ${describeMarkdownTime(selection)}`);
  const where = describeVideoSelection(selection);
  if (where) lines.push(`**Where on the frame:** ${where}`);
  return lines;
}

// Both the timecode and the raw milliseconds, so an agent can read either.
function describeMarkdownTime({ startMs, endMs }: FeedbackSelection) {
  if (endMs === null) {
    return `At ${formatMarkdownTimecode(startMs)} (${startMs} ms)`;
  }
  return `From ${formatMarkdownTimecode(startMs)} to ${formatMarkdownTimecode(endMs)} (${startMs} to ${endMs} ms)`;
}

// `mm:ss.mmm`, with an `hh:` prefix past an hour.
function formatMarkdownTimecode(ms: number) {
  const totalMs = Math.max(0, Math.floor(ms));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor(totalMs / 60_000) % 60;
  const seconds = Math.floor(totalMs / 1000) % 60;
  const clock = `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(totalMs % 1000, 3)}`;
  return hours > 0 ? `${pad(hours, 2)}:${clock}` : clock;
}

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

export function formatFeedbackListAsMarkdown(
  feedbacks: FeedbackListItemForMarkdown[],
): string {
  if (feedbacks.length === 0) return "No feedback items found.";
  return feedbacks.map(formatFeedbackListItemAsMarkdown).join("\n\n---\n\n");
}

/**
 * Render a Diagnostic Trail as markdown bullet lines (Console + Network).
 * Returns `[]` when there is nothing to show, so callers can wrap it in their
 * own heading or `<details>` block only when content exists. Shared so the
 * agent API and the GitHub/Linear issue bodies stay consistent.
 */
export function formatDiagnosticTrailLines(
  trail: DiagnosticTrail | null | undefined,
): string[] {
  if (!trail) return [];
  const consoleEntries = trail.console;
  const networkEntries = trail.network;
  if (consoleEntries.length === 0 && networkEntries.length === 0) return [];

  const lines: string[] = [];

  if (consoleEntries.length > 0) {
    lines.push("**Console**", "");
    for (const entry of consoleEntries) {
      lines.push(`- ${formatConsoleEntry(entry)}`);
    }
    lines.push("");
  }

  if (networkEntries.length > 0) {
    lines.push("**Network**", "");
    for (const entry of networkEntries) {
      lines.push(`- ${formatNetworkEntry(entry)}`);
    }
  }

  return lines;
}

/**
 * Render Custom metadata as `key: value` bullet lines in declared order.
 * Returns `[]` when there are no pairs, like `formatDiagnosticTrailLines`.
 */
export function formatCustomMetadataLines(
  customMetadata: CustomMetadata | null | undefined,
): string[] {
  if (!customMetadata) return [];
  return Object.entries(customMetadata).map(
    ([key, value]) => `- ${key}: ${collapseWhitespace(String(value))}`,
  );
}
