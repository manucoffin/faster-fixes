// Atlassian Document Format body for a mirrored Feedback. Mirrors the sections of
// the Markdown formatter of the integration domain (github/format-issue-body),
// but ADF is a structured JSON tree — Jira's v3 API rejects Markdown — so the
// two cannot share a renderer. Keep the section order in sync when either side changes.

import {
  formatTimelineNotes,
  formatTimelineOffset,
  formatTimelineStep,
  type RecordingTimeline,
  type RecordingTimelineEntry,
} from "@/app/_domains/feedback";
import {
  describeTimeline,
  describeVideoLocation,
  formatIssueTitle,
  formatRecordingDuration,
  type IssueRecording,
} from "../github/format-issue-body";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";

// Jira's limit on a description, counted here on the serialized document,
// which is never shorter than the text Jira may count instead.
const JIRA_DESCRIPTION_MAX_CHARACTERS = 32_767;

type AdfMark =
  | { type: "strong" }
  | { type: "code" }
  | { type: "em" }
  | { type: "link"; attrs: { href: string } };

type AdfText = { type: "text"; text: string; marks?: AdfMark[] };

type AdfNode =
  | AdfText
  | { type: "paragraph"; content?: AdfNode[] }
  | { type: "blockquote"; content: AdfNode[] }
  | { type: "bulletList"; content: AdfNode[] }
  | { type: "listItem"; content: AdfNode[] }
  | { type: "expand"; attrs: { title: string }; content: AdfNode[] };

export type AdfDocument = {
  version: 1;
  type: "doc";
  content: AdfNode[];
};

export type FeedbackForJiraIssue = {
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
  diagnosticTrail: DiagnosticTrail | null;
  customMetadata?: CustomMetadata | null;
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

const SEPARATOR = " · ";

function text(value: string, marks?: AdfMark[]): AdfText {
  return { type: "text", text: value, ...(marks ? { marks } : {}) };
}

function link(label: string, href: string): AdfText {
  return text(label, [{ type: "link", attrs: { href } }]);
}

// Jira rejects a text node with an empty string, so a blank line becomes an
// empty paragraph rather than a paragraph wrapping "".
function paragraph(content: AdfNode[]): AdfNode {
  return content.length > 0
    ? { type: "paragraph", content }
    : { type: "paragraph" };
}

function bullet(content: AdfNode[]): AdfNode {
  return { type: "listItem", content: [paragraph(content)] };
}

/**
 * Jira rejects a summary containing newline characters outright (400), unlike
 * GitHub and Linear which accept them — so the comment is flattened to one line
 * before the shared 80-char truncation. Truncating first would not help: a
 * newline can sit anywhere inside the first 80 characters.
 */
export function formatJiraSummary(comment: string): string {
  return formatIssueTitle(comment.replace(/\s+/g, " ").trim());
}

export function formatIssueAdf(feedback: FeedbackForJiraIssue): AdfDocument {
  if (feedback.videoId) return formatVideoIssueAdf(feedback);

  const content: AdfNode[] = [quoteComment(feedback.comment)];

  if (feedback.pageUrl) {
    const displayUrl = feedback.pageUrl.replace(/^https?:\/\//, "");
    content.push(
      paragraph([
        text("Page: ", [{ type: "strong" }]),
        link(displayUrl, feedback.pageUrl),
      ]),
    );
  }

  const elementParts = collectElementParts(feedback);
  if (elementParts.length > 0) {
    content.push(
      paragraph([text("Element: ", [{ type: "strong" }]), ...elementParts]),
    );
  }

  if (feedback.recording) {
    content.push(recordingParagraph(feedback.recording));
  }

  if (feedback.screenshotUrl) {
    content.push(screenshotParagraph(feedback.screenshotUrl));
  }

  const environment = buildEnvironmentExpand(feedback);
  if (environment) content.push(environment);

  const customMetadata = buildCustomMetadataExpand(feedback.customMetadata);
  if (customMetadata) content.push(customMetadata);

  content.push(dashboardFooter(feedback.dashboardUrl));

  // The Timeline already holds the Diagnostic Trail's entries, on one clock
  // with the Reviewer's steps; Diagnostics stays when there is no readable
  // Recording. Inserted last so its budget is what the rest leaves.
  const timeline = feedback.recording?.timeline;
  const tail =
    timeline && timeline.entries.length > 0
      ? buildTimelineExpand(fitTimeline(timeline, content))
      : buildDiagnosticsExpand(feedback.diagnosticTrail);
  if (tail) content.splice(content.length - 1, 0, tail);

  return { version: 1, type: "doc", content };
}

// Same section order as the Markdown video variant: no page, element, Custom
// metadata or Diagnostics, and the captured frame is the Screenshot.
function formatVideoIssueAdf(feedback: FeedbackForJiraIssue): AdfDocument {
  const content: AdfNode[] = [
    quoteComment(feedback.comment),
    paragraph([
      text("Video: ", [{ type: "strong" }]),
      text(describeVideoLocation(feedback).join(SEPARATOR)),
    ]),
  ];

  if (feedback.screenshotUrl) {
    content.push(screenshotParagraph(feedback.screenshotUrl));
  }

  content.push(
    paragraph([
      text("Reported by: ", [{ type: "strong" }]),
      text(feedback.reviewerName),
    ]),
  );

  const envParts = environmentParts(feedback);
  if (envParts.length > 0) {
    content.push(
      paragraph([
        text("Environment: ", [{ type: "strong" }]),
        text(envParts.join(SEPARATOR)),
      ]),
    );
  }

  content.push(dashboardFooter(feedback.dashboardUrl));

  return { version: 1, type: "doc", content };
}

// The reviewer's words lead, quoted, so they read as a citation rather than as
// Faster Fixes speaking.
function quoteComment(comment: string): AdfNode {
  return {
    type: "blockquote",
    content: comment
      .split("\n")
      .map((line) => paragraph(line.length > 0 ? [text(line)] : [])),
  };
}

// ADF cannot hotlink an external image: `mediaSingle` only references files
// already uploaded to Jira's media store, so the screenshot ships as a link.
function screenshotParagraph(screenshotUrl: string): AdfNode {
  return paragraph([
    text("Screenshot: ", [{ type: "strong" }]),
    link("view", screenshotUrl),
  ]);
}

function recordingParagraph({
  playerUrl,
  durationMs,
}: IssueRecording): AdfNode {
  return paragraph([
    text("Recording: ", [{ type: "strong" }]),
    link("Play in Faster Fixes", playerUrl),
    text(`${SEPARATOR}${formatRecordingDuration(durationMs)}`),
  ]);
}

function dashboardFooter(dashboardUrl: string): AdfNode {
  return paragraph([
    link("Faster Fixes", "https://faster-fixes.com"),
    text(SEPARATOR, [{ type: "em" }]),
    link("View in dashboard", dashboardUrl),
  ]);
}

function collectElementParts(feedback: FeedbackForJiraIssue): AdfNode[] {
  const md = feedback.metadata;
  const codeParts: string[] = [];

  if (typeof md?.reactComponentPath === "string") {
    codeParts.push(md.reactComponentPath);
  }
  if (typeof md?.sourceFile === "string") codeParts.push(md.sourceFile);
  if (feedback.selector) codeParts.push(feedback.selector);

  const nodes: AdfNode[] = [];
  codeParts.forEach((part, index) => {
    if (index > 0) nodes.push(text(SEPARATOR));
    nodes.push(text(part, [{ type: "code" }]));
  });

  if (feedback.clickX != null && feedback.clickY != null) {
    if (nodes.length > 0) nodes.push(text(SEPARATOR));
    nodes.push(text(`at (${feedback.clickX}, ${feedback.clickY})`));
  }

  return nodes;
}

function environmentParts(feedback: FeedbackForJiraIssue): string[] {
  const parts: string[] = [];

  if (feedback.browserName) {
    parts.push(
      feedback.browserName +
        (feedback.browserVersion ? ` ${feedback.browserVersion}` : ""),
    );
  }
  if (feedback.os) parts.push(feedback.os);
  if (feedback.viewportWidth && feedback.viewportHeight) {
    parts.push(`${feedback.viewportWidth} × ${feedback.viewportHeight}`);
  }
  return parts;
}

function buildEnvironmentExpand(
  feedback: FeedbackForJiraIssue,
): AdfNode | null {
  const parts = environmentParts(feedback);

  if (parts.length === 0 && !feedback.reviewerName) return null;

  const body: AdfNode[] = [];
  if (parts.length > 0) body.push(paragraph([text(parts.join(SEPARATOR))]));
  body.push(paragraph([text(`Submitted by ${feedback.reviewerName}`)]));

  return { type: "expand", attrs: { title: "Environment" }, content: body };
}

function buildCustomMetadataExpand(
  customMetadata: CustomMetadata | null | undefined,
): AdfNode | null {
  const entries = Object.entries(customMetadata ?? {});
  if (entries.length === 0) return null;

  return {
    type: "expand",
    attrs: { title: "Custom metadata" },
    content: [
      {
        type: "bulletList",
        content: entries.map(([key, value]) =>
          bullet([text(`${key}: ${collapseWhitespace(String(value))}`)]),
        ),
      },
    ],
  };
}

function buildDiagnosticsExpand(trail: DiagnosticTrail | null): AdfNode | null {
  const consoleEntries = trail?.console ?? [];
  const networkEntries = trail?.network ?? [];
  if (consoleEntries.length === 0 && networkEntries.length === 0) return null;

  const body: AdfNode[] = [];

  if (consoleEntries.length > 0) {
    body.push(paragraph([text("Console", [{ type: "strong" }])]));
    body.push({
      type: "bulletList",
      content: consoleEntries.map((entry) =>
        bullet([
          text(entry.level, [{ type: "code" }]),
          text(` ${collapseWhitespace(entry.message)}`),
        ]),
      ),
    });
  }

  if (networkEntries.length > 0) {
    body.push(paragraph([text("Network", [{ type: "strong" }])]));
    body.push({
      type: "bulletList",
      content: networkEntries.map((entry) =>
        bullet([
          text(entry.method, [{ type: "code" }]),
          text(
            ` ${entry.url} → ${entry.status === 0 ? "ERR" : entry.status} (${Math.round(entry.duration)}ms)`,
          ),
        ]),
      ),
    });
  }

  return {
    type: "expand",
    attrs: {
      title: `Diagnostics (${consoleEntries.length} console, ${networkEntries.length} network)`,
    },
    content: body,
  };
}

function buildTimelineExpand(timeline: RecordingTimeline): AdfNode {
  return {
    type: "expand",
    attrs: { title: describeTimeline(timeline) },
    content: [
      ...formatTimelineNotes(timeline).map((note) => paragraph([text(note)])),
      {
        type: "bulletList",
        content: timeline.entries.map((entry) =>
          bullet([
            text(`${formatTimelineOffset(entry.offsetMs)}  `),
            ...timelineEntryNodes(entry),
          ]),
        ),
      },
    ],
  };
}

function timelineEntryNodes(entry: RecordingTimelineEntry): AdfText[] {
  if (entry.kind === "console") {
    return [
      text(entry.entry.level, [{ type: "code" }]),
      text(` ${collapseWhitespace(entry.entry.message)}`),
    ];
  }
  if (entry.kind === "network") {
    const { method, url, status, duration } = entry.entry;
    return [
      text(method, [{ type: "code" }]),
      text(
        ` ${url} → ${status === 0 ? "ERR" : status} (${Math.round(duration)}ms)`,
      ),
    ];
  }
  return [text(formatTimelineStep(entry.step))];
}

// Drops entries from the start, the Selection always kept, until the whole
// description fits Jira's limit.
function fitTimeline(
  timeline: RecordingTimeline,
  rest: AdfNode[],
): RecordingTimeline {
  const budget =
    JIRA_DESCRIPTION_MAX_CHARACTERS -
    JSON.stringify({ version: 1, type: "doc", content: rest }).length;
  let fitted = timeline;
  while (
    fitted.entries.length > 1 &&
    // +1 for the comma that joins the expand to its neighbours.
    JSON.stringify(buildTimelineExpand(fitted)).length + 1 > budget
  ) {
    fitted = {
      ...fitted,
      entries: fitted.entries.slice(1),
      droppedCount: fitted.droppedCount + 1,
    };
  }
  return fitted;
}

// Console messages can be multi-line; ADF list items read better as one line.
function collapseWhitespace(value: string): string {
  return value.replace(/\s*\n\s*/g, " ").trim();
}
