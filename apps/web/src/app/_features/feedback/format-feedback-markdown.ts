/**
 * Shared markdown formatter for feedback items.
 * Used by both the dashboard export and the agent API.
 */

export type FeedbackForMarkdown = {
  id: string;
  status: string;
  comment: string;
  pageUrl: string;
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
};

export function formatFeedbackAsMarkdown(f: FeedbackForMarkdown): string {
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
  const locationLines: string[] = [];
  locationLines.push(`**Page URL:** ${f.pageUrl}`);
  if (md?.reactComponentPath) {
    locationLines.push(`**Component tree:** \`${md.reactComponentPath}\``);
  }
  if (md?.sourceFile) {
    locationLines.push(`**Source file:** \`${md.sourceFile}\``);
  }
  if (f.selector) locationLines.push(`**DOM selector:** \`${f.selector}\``);
  if (md?.elementDescription) {
    locationLines.push(`**Element:** ${md.elementDescription}`);
  }

  lines.push("");
  lines.push("## Where to look");
  lines.push("");
  lines.push(...locationLines);

  // What's wrong — the user's description as a blockquote
  lines.push("");
  lines.push("## What's wrong");
  lines.push("");
  const quotedComment = f.comment
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  lines.push(quotedComment);

  if (md?.nearbyText) {
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

export function formatFeedbackListAsMarkdown(
  feedbacks: FeedbackForMarkdown[],
): string {
  if (feedbacks.length === 0) return "No feedback items found.";
  return feedbacks
    .map((f) => formatFeedbackAsMarkdown(f))
    .join("\n\n---\n\n");
}
