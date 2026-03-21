import { format } from "date-fns";
import type { GetFeedbackOutput } from "../inbox/_features/get-feedback.trpc.query";

type FeedbackItem = GetFeedbackOutput[number];

export function formatFeedbackAsMarkdown(f: FeedbackItem): string {
  const lines: string[] = [];
  lines.push(`# Feedback`);
  lines.push("");
  lines.push(`**Page:** ${f.pageUrl}`);
  lines.push(`**Status:** ${f.status}`);
  if (f.assignee) lines.push(`**Assignee:** ${f.assignee.name}`);
  lines.push(`**Submitted by:** ${f.reviewer.name}`);
  lines.push(`**Date:** ${format(new Date(f.createdAt), "MMM d, yyyy")}`);
  lines.push("");
  lines.push(`## Comment`);
  lines.push("");
  lines.push(f.comment);

  const meta: string[] = [];
  if (f.browserName) {
    meta.push(
      `**Browser:** ${f.browserName}${f.browserVersion ? ` ${f.browserVersion}` : ""}`,
    );
  }
  if (f.os) meta.push(`**OS:** ${f.os}`);
  if (f.viewportWidth && f.viewportHeight) {
    meta.push(`**Viewport:** ${f.viewportWidth}\u00d7${f.viewportHeight}`);
  }
  if (f.selector) meta.push(`**Selector:** \`${f.selector}\``);
  if (f.clickX != null && f.clickY != null) {
    meta.push(
      `**Click position:** (${Math.round(f.clickX)}, ${Math.round(f.clickY)})`,
    );
  }

  if (meta.length > 0) {
    lines.push("");
    lines.push(`## Browser & context`);
    lines.push("");
    lines.push(...meta);
  }

  if (f.screenshotUrl) {
    lines.push("");
    lines.push(`## Screenshot`);
    lines.push("");
    lines.push(`![Feedback screenshot](${f.screenshotUrl})`);
  }

  return lines.join("\n");
}
