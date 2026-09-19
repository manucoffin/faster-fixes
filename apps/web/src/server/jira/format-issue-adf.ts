// Atlassian Document Format body for a mirrored Feedback. Mirrors the sections of
// the Markdown formatter of the integration domain (github/format-issue-body),
// but ADF is a structured JSON tree — Jira's v3 API rejects Markdown — so the
// two cannot share a renderer. Keep the section order in sync when either side changes.

import { formatIssueTitle } from "@/app/_domains/integration/_helpers/github/format-issue-body";
import type { DiagnosticTrail } from "@fasterfixes/core";

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
  pageUrl: string;
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
  dashboardUrl: string;
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
  const content: AdfNode[] = [];

  // The reviewer's words lead, quoted, so they read as a citation rather than as
  // Faster Fixes speaking.
  content.push({
    type: "blockquote",
    content: feedback.comment
      .split("\n")
      .map((line) => paragraph(line.length > 0 ? [text(line)] : [])),
  });

  const displayUrl = feedback.pageUrl.replace(/^https?:\/\//, "");
  content.push(
    paragraph([
      text("Page: ", [{ type: "strong" }]),
      link(displayUrl, feedback.pageUrl),
    ]),
  );

  const elementParts = collectElementParts(feedback);
  if (elementParts.length > 0) {
    content.push(
      paragraph([text("Element: ", [{ type: "strong" }]), ...elementParts]),
    );
  }

  // ADF cannot hotlink an external image: `mediaSingle` only references files
  // already uploaded to Jira's media store, so the screenshot ships as a link.
  if (feedback.screenshotUrl) {
    content.push(
      paragraph([
        text("Screenshot: ", [{ type: "strong" }]),
        link("view", feedback.screenshotUrl),
      ]),
    );
  }

  const environment = buildEnvironmentExpand(feedback);
  if (environment) content.push(environment);

  const diagnostics = buildDiagnosticsExpand(feedback.diagnosticTrail);
  if (diagnostics) content.push(diagnostics);

  content.push(
    paragraph([
      link("Faster Fixes", "https://faster-fixes.com"),
      text(SEPARATOR, [{ type: "em" }]),
      link("View in dashboard", feedback.dashboardUrl),
    ]),
  );

  return { version: 1, type: "doc", content };
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

function buildEnvironmentExpand(
  feedback: FeedbackForJiraIssue,
): AdfNode | null {
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

  if (parts.length === 0 && !feedback.reviewerName) return null;

  const body: AdfNode[] = [];
  if (parts.length > 0) body.push(paragraph([text(parts.join(SEPARATOR))]));
  body.push(paragraph([text(`Submitted by ${feedback.reviewerName}`)]));

  return { type: "expand", attrs: { title: "Environment" }, content: body };
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

// Console messages can be multi-line; ADF list items read better as one line.
function collapseWhitespace(value: string): string {
  return value.replace(/\s*\n\s*/g, " ").trim();
}
