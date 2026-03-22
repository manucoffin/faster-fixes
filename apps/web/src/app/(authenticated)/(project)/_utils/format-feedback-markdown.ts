import type { GetFeedbackOutput } from "../inbox/_features/get-feedback.trpc.query";

type FeedbackItem = GetFeedbackOutput[number];

export function formatFeedbackAsMarkdown(f: FeedbackItem): string {
  const md = f.metadata as Record<string, unknown> | null;
  const lines: string[] = [];

  // Task framing — tell the AI agent what to do
  lines.push("# Bug Report");
  lines.push("");
  lines.push(
    "A user reported a bug on your application. Find and fix the issue described below.",
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
      "Examine this screenshot for visual context of the reported issue:",
    );
    lines.push(`![Bug report screenshot](${f.screenshotUrl})`);
  }

  return lines.join("\n");
}
