import type { FeedbackStatus } from "@/app/_domains/feedback";

// Block Kit blocks are loosely typed; we model only the shapes we emit rather
// than depending on the full Block Kit type surface.
type SlackBlock = Record<string, unknown>;

/**
 * Identifies who moved a feedback to its current status. The "agent" actor lets
 * us distinguish automated resolutions from human ones in the badge.
 */
export type FeedbackActor = "agent" | "human";

/**
 * Renders a short status badge with an emoji prefix. The resolved state varies
 * by actor so the workspace can tell automated fixes from manual ones. The
 * "closed" status is surfaced as "Archived" per the project glossary.
 */
export function statusBadge(
  status: FeedbackStatus,
  actor: FeedbackActor,
): string {
  switch (status) {
    case "new":
      return "🆕 New";
    case "in_progress":
      return "⏳ In progress";
    case "resolved":
      return actor === "agent" ? "🤖 Resolved by agent" : "✅ Resolved";
    case "closed":
      return "🗄️ Archived";
    default: {
      // Exhaustiveness guard: a new FeedbackStatus must update this badge.
      const exhaustiveCheck: never = status;
      return exhaustiveCheck;
    }
  }
}

type BuildFeedbackBlocksFeedback = {
  reviewerName: string | null;
  comment: string;
  pageUrl: string;
  browserName: string | null;
  os: string | null;
};

type BuildFeedbackBlocksParams = {
  feedback: BuildFeedbackBlocksFeedback;
  status: FeedbackStatus;
  actor: FeedbackActor;
  dashboardUrl: string;
  screenshotUrl: string | null;
};

type BuildFeedbackBlocksResult = {
  blocks: SlackBlock[];
  text: string;
};

/**
 * Builds the Slack Block Kit payload for a feedback notification. Pure: callers
 * pass a freshly minted screenshot URL since signed asset URLs are short-lived.
 */
export function buildFeedbackBlocks({
  feedback,
  status,
  actor,
  dashboardUrl,
  screenshotUrl,
}: BuildFeedbackBlocksParams): BuildFeedbackBlocksResult {
  const reviewerName = feedback.reviewerName ?? "Anonymous";

  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${reviewerName}*\n${feedback.comment}`,
      },
    },
  ];

  const contextElements: SlackBlock[] = [
    {
      type: "mrkdwn",
      text: `<${feedback.pageUrl}|${feedback.pageUrl}>`,
    },
  ];

  const environment = [feedback.browserName, feedback.os]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  if (environment) {
    contextElements.push({ type: "mrkdwn", text: environment });
  }

  blocks.push({ type: "context", elements: contextElements });

  if (screenshotUrl) {
    blocks.push({
      type: "image",
      image_url: screenshotUrl,
      alt_text: "Feedback screenshot",
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Status:* ${statusBadge(status, actor)}`,
    },
  });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${dashboardUrl}|Open in Faster Fixes>`,
    },
    accessory: {
      type: "button",
      text: { type: "plain_text", text: "Open in Faster Fixes" },
      url: dashboardUrl,
    },
  });

  const text = `New feedback from ${reviewerName}: ${feedback.comment}`;

  return { blocks, text };
}
