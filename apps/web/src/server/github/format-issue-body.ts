type FeedbackForIssue = {
  id: string;
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
  projectId: string;
  dashboardUrl: string;
};

export function formatIssueTitle(comment: string): string {
  if (comment.length <= 80) return comment;

  const truncated = comment.slice(0, 80);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 40) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
}

export function formatIssueBody(feedback: FeedbackForIssue): string {
  const lines: string[] = [];

  // Comment first — most important
  const quoted = feedback.comment
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  lines.push(quoted);
  lines.push("");

  // Page URL
  const displayUrl = feedback.pageUrl.replace(/^https?:\/\//, "");
  lines.push(
    `**Page:** [${displayUrl}](${feedback.pageUrl})`,
  );

  // Component path + selector
  const locationParts: string[] = [];
  const md = feedback.metadata;
  if (md?.reactComponentPath) {
    locationParts.push(`\`${md.reactComponentPath}\``);
  }
  if (md?.sourceFile) {
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
  const envParts: string[] = [];
  if (feedback.browserName) {
    envParts.push(
      feedback.browserName +
        (feedback.browserVersion ? ` ${feedback.browserVersion}` : ""),
    );
  }
  if (feedback.os) envParts.push(feedback.os);
  if (feedback.viewportWidth && feedback.viewportHeight) {
    envParts.push(`${feedback.viewportWidth} \u00d7 ${feedback.viewportHeight}`);
  }

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

  // Footer
  lines.push("");
  lines.push(
    `<sub><a href="https://faster-fixes.com">Faster Fixes</a> \u00b7 <a href="${feedback.dashboardUrl}">View in dashboard</a></sub>`,
  );

  return lines.join("\n");
}
