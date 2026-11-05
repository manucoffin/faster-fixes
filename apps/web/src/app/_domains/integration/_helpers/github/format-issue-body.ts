import {
  formatCustomMetadataLines,
  formatDiagnosticTrailLines,
} from "@/app/_domains/feedback";
import {
  describeVideoFeedbackTime,
  describeVideoSelection,
  readVideoSelection,
} from "@/app/_domains/video";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";

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

  // Collapsible diagnostics block (console + network)
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

  lines.push("", dashboardFooter(feedback.dashboardUrl));

  return lines.join("\n");
}

// A video Feedback has no page, element, Custom metadata or Diagnostics: the
// Video line says where to look and the captured frame is the Screenshot.
function formatVideoIssueBody(feedback: FeedbackForIssue): string {
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

  const lines = [
    quoteComment(feedback.comment),
    "",
    `**Video:** ${videoParts.join(" \u00b7 ")}`,
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
