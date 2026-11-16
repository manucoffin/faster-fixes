import {
  type FeedbackForIssue,
  formatIssueBodyContent,
  formatIssueTitle,
} from "../github/format-issue-body";

// Trello refuses a card description longer than this.
export const TRELLO_DESCRIPTION_MAX_CHARACTERS = 16_384;

const TRUNCATION_NOTE = "_Truncated. The full report is in the dashboard._";

// The Screenshot is attached to the card as a file, so the description never
// embeds a signed URL that would expire.
export type FeedbackForTrelloCard = Omit<FeedbackForIssue, "screenshotUrl">;

// Trello shows a card name on one line.
export function formatTrelloCardName(comment: string): string {
  return formatIssueTitle(comment.replace(/\s+/g, " ").trim());
}

/**
 * The shared Markdown body, cut to Trello's limit. The dashboard link is the
 * fallback for whatever is cut and for a Screenshot that failed to upload, so
 * the content gives way and the footer never does.
 */
export function formatTrelloCardDescription(
  feedback: FeedbackForTrelloCard,
): string {
  const content = formatIssueBodyContent({ ...feedback, screenshotUrl: null });
  const footer = `[Faster Fixes](https://faster-fixes.com) · [View in dashboard](${feedback.dashboardUrl})`;

  const full = `${content}\n\n${footer}`;
  if (full.length <= TRELLO_DESCRIPTION_MAX_CHARACTERS) return full;

  const budget =
    TRELLO_DESCRIPTION_MAX_CHARACTERS -
    `\n\n${TRUNCATION_NOTE}\n\n${footer}`.length;
  return `${content.slice(0, budget).trimEnd()}\n\n${TRUNCATION_NOTE}\n\n${footer}`;
}
