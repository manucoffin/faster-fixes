import {
  formatCustomMetadataLines,
  formatDiagnosticTrailLines,
  formatTimelineLines,
  type RecordingTimeline,
} from "@/app/_domains/feedback";
import {
  describeVideoFeedbackTime,
  describeVideoSelection,
  readVideoSelection,
} from "@/app/_domains/video";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";

// GitHub's limit on an Issue body is 65,536 characters; this leaves room for
// the rest of the body. Linear's is higher.
const TIMELINE_MAX_CHARACTERS = 50_000;

export type IssueRecording = {
  playerUrl: string;
  durationMs: number;
  // `null` when the file cannot be read: Diagnostics is rendered instead.
  timeline: RecordingTimeline | null;
};

type FeedbackForIssue = {
  id: string;
  comment: string;
  pageUrl: string | null;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  screenshotUrl: string | null;
  reviewerName: string;
  metadata: Record<string, unknown> | null;
  diagnosticTrail?: DiagnosticTrail | null;
  customMetadata?: CustomMetadata | null;
  projectId: string;
  dashboardUrl: string;
  // Optional: absent or null when the Feedback has no Recording.
  recording?: IssueRecording | null;
  // Optional: absent or null on a page Feedback (ADR-0020).
  videoId?: string | null;
  videoTitle?: string | null;
  startMs?: number | null;
  endMs?: number | null;
  frameX?: number | null;
  frameY?: number | null;
  frameWidth?: number | null;
  frameHeight?: number | null;
};

export function formatIssueTitle(comment: string): string {
  if (comment.length <= 80) return comment;

  const truncated = comment.slice(0, 80);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 40) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}

export function formatIssueBody(feedback: FeedbackForIssue): string {
  if (feedback.videoId) return formatVideoIssueBody(feedback);

  const lines: string[] = [quoteComment(feedback.comment), ""];

  // Page URL
  if (feedback.pageUrl) {
    const displayUrl = feedback.pageUrl.replace(/^https?:\/\//, "");
    lines.push(`**Page:** [${displayUrl}](${feedback.pageUrl})`);
  }

  // Component path + selector
  const locationParts: string[] = [];
  const md = feedback.metadata;
  if (typeof md?.reactComponentPath === "string" && md.reactComponentPath) {
    locationParts.push(`\`${md.reactComponentPath}\``);
  }
  if (typeof md?.sourceFile === "string" && md.sourceFile) {
    locationParts.push(`\`${md.sourceFile}\``);
  }
  if (feedback.selector) {
    locationParts.push(`\`${feedback.selector}\``);
  }
  if (feedback.clickX != null && feedback.clickY != null) {
    locationParts.push(`at (${feedback.clickX}, ${feedback.clickY})`);
  }
  if (locationParts.length > 0) {
    lines.push(`**Element:** ${locationParts.join(" \u00b7 ")}`);
  }

  if (feedback.recording) {
    lines.push(formatRecordingLine(feedback.recording));
  }

  // Screenshot
  if (feedback.screenshotUrl) {
    lines.push("");
    lines.push(`![Screenshot](${feedback.screenshotUrl})`);
  }

  // Collapsible environment block
  const envParts = environmentParts(feedback);

  if (envParts.length > 0 || feedback.reviewerName) {
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Environment</summary>");
    lines.push("");
    if (envParts.length > 0) {
      lines.push(envParts.join(" \u00b7 "));
    }
    lines.push(`Submitted by ${feedback.reviewerName}`);
    lines.push("");
    lines.push("</details>");
  }

  const customMetadataLines = formatCustomMetadataLines(
    feedback.customMetadata,
  );
  if (customMetadataLines.length > 0) {
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Custom metadata</summary>");
    lines.push("");
    lines.push(...customMetadataLines);
    lines.push("");
    lines.push("</details>");
  }

  lines.push(...diagnosticsOrTimelineLines(feedback));

  lines.push("", dashboardFooter(feedback.dashboardUrl));

  return lines.join("\n");
}

// The Timeline already holds the Diagnostic Trail's entries, on one clock with
// the Reviewer's steps; Diagnostics stays when there is no readable Recording.
function diagnosticsOrTimelineLines(feedback: FeedbackForIssue): string[] {
  const timeline = feedback.recording?.timeline;
  if (timeline && timeline.entries.length > 0) {
    const fitted = fitTimeline(timeline);
    return [
      "",
      "<details>",
      `<summary>${describeTimeline(fitted)}</summary>`,
      "",
      ...formatTimelineLines(fitted),
      "",
      "</details>",
    ];
  }

  const lines: string[] = [];
  const diagnosticLines = formatDiagnosticTrailLines(feedback.diagnosticTrail);
  if (diagnosticLines.length > 0) {
    const consoleCount = feedback.diagnosticTrail?.console.length ?? 0;
    const networkCount = feedback.diagnosticTrail?.network.length ?? 0;
    lines.push("");
    lines.push("<details>");
    lines.push(
      `<summary>Diagnostics (${consoleCount} console, ${networkCount} network)</summary>`,
    );
    lines.push("");
    lines.push(...diagnosticLines);
    lines.push("");
    lines.push("</details>");
  }
  return lines;
}

function formatRecordingLine({ playerUrl, durationMs }: IssueRecording) {
  return `**Recording:** [Play in Faster Fixes](${playerUrl}) \u00b7 ${formatRecordingDuration(durationMs)}`;
}

export function formatRecordingDuration(durationMs: number) {
  return `${Math.max(1, Math.round(durationMs / 1000))} s`;
}

export function describeTimeline({ entries }: RecordingTimeline) {
  const count = (kind: RecordingTimeline["entries"][number]["kind"]) =>
    entries.filter((entry) => entry.kind === kind).length;
  const steps = count("step");
  return `Timeline (${steps} ${steps === 1 ? "step" : "steps"}, ${count("console")} console, ${count("network")} network)`;
}

// Drops entries from the start, the Selection always kept, until the lines fit.
function fitTimeline(timeline: RecordingTimeline): RecordingTimeline {
  let fitted = timeline;
  while (
    fitted.entries.length > 1 &&
    formatTimelineLines(fitted).join("\n").length > TIMELINE_MAX_CHARACTERS
  ) {
    fitted = {
      ...fitted,
      entries: fitted.entries.slice(1),
      droppedCount: fitted.droppedCount + 1,
    };
  }
  return fitted;
}

// A video Feedback has no page, element, Custom metadata or Diagnostics: the
// Video line says where to look and the captured frame is the Screenshot.
function formatVideoIssueBody(feedback: FeedbackForIssue): string {
  const lines = [
    quoteComment(feedback.comment),
    "",
    `**Video:** ${describeVideoLocation(feedback).join(" \u00b7 ")}`,
  ];

  if (feedback.screenshotUrl) {
    lines.push("", `![Screenshot](${feedback.screenshotUrl})`);
  }

  lines.push("", `**Reported by:** ${feedback.reviewerName}`);

  const envParts = environmentParts(feedback);
  if (envParts.length > 0) {
    lines.push("", `**Environment:** ${envParts.join(" \u00b7 ")}`);
  }

  lines.push("", dashboardFooter(feedback.dashboardUrl));

  return lines.join("\n");
}

// The Video line's parts (title, time, position on the frame), shared by every
// Tracker's video variant so GitHub, Linear and Jira say the same thing.
export function describeVideoLocation(
  feedback: Pick<
    FeedbackForIssue,
    | "videoTitle"
    | "startMs"
    | "endMs"
    | "frameX"
    | "frameY"
    | "frameWidth"
    | "frameHeight"
  >,
): string[] {
  const videoParts: string[] = [];
  if (feedback.videoTitle) videoParts.push(feedback.videoTitle);
  if (feedback.startMs != null) {
    videoParts.push(
      describeVideoFeedbackTime(feedback.startMs, feedback.endMs ?? null),
    );
  }
  const position = describeVideoSelection(
    readVideoSelection({
      frameX: feedback.frameX ?? null,
      frameY: feedback.frameY ?? null,
      frameWidth: feedback.frameWidth ?? null,
      frameHeight: feedback.frameHeight ?? null,
    }),
  );
  if (position) videoParts.push(position);

  return videoParts;
}

function quoteComment(comment: string) {
  return comment
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function environmentParts(feedback: FeedbackForIssue) {
  const parts: string[] = [];
  if (feedback.browserName) {
    parts.push(
      feedback.browserName +
        (feedback.browserVersion ? ` ${feedback.browserVersion}` : ""),
    );
  }
  if (feedback.os) parts.push(feedback.os);
  if (feedback.viewportWidth && feedback.viewportHeight) {
    parts.push(`${feedback.viewportWidth} \u00d7 ${feedback.viewportHeight}`);
  }
  return parts;
}

function dashboardFooter(dashboardUrl: string) {
  return `<sub><a href="https://faster-fixes.com">Faster Fixes</a> \u00b7 <a href="${dashboardUrl}">View in dashboard</a></sub>`;
}
