import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";
import { buildFeedbackDashboardUrl } from "../../_helpers/build-feedback-dashboard-url";
import { formatTrelloCardDescription } from "../../_helpers/trello/format-card-description";
import { refreshIssueRecording } from "../refresh-issue-recording";
import type { Prisma } from "@workspace/db/types";

export const trelloCardFeedbackInclude = {
  reviewer: { select: { name: true } },
  video: { select: { title: true } },
  recording: { select: { key: true } },
} satisfies Prisma.FeedbackInclude;

type FeedbackForTrelloCardDescription = Prisma.FeedbackGetPayload<{
  include: typeof trelloCardFeedbackInclude;
}>;

/**
 * The card description of a Feedback, with its Recording as it stands now.
 * Shared by card creation and the late-Recording refresh so a refreshed card
 * reads exactly like one created with its Recording.
 */
export async function getTrelloCardDescription(
  feedback: FeedbackForTrelloCardDescription,
) {
  const recording = await refreshIssueRecording(feedback);

  return formatTrelloCardDescription({
    id: feedback.id,
    comment: feedback.comment,
    pageUrl: feedback.pageUrl,
    selector: feedback.selector,
    clickX: feedback.clickX,
    clickY: feedback.clickY,
    browserName: feedback.browserName,
    browserVersion: feedback.browserVersion,
    os: feedback.os,
    viewportWidth: feedback.viewportWidth,
    viewportHeight: feedback.viewportHeight,
    reviewerName: feedback.reviewer.name,
    metadata: feedback.metadata as Record<string, unknown> | null,
    diagnosticTrail: feedback.diagnosticTrail as DiagnosticTrail | null,
    customMetadata: feedback.customMetadata as CustomMetadata | null,
    projectId: feedback.projectId,
    dashboardUrl: buildFeedbackDashboardUrl(feedback),
    videoId: feedback.videoId,
    videoTitle: feedback.video?.title,
    startMs: feedback.startMs,
    endMs: feedback.endMs,
    frameX: feedback.frameX,
    frameY: feedback.frameY,
    frameWidth: feedback.frameWidth,
    frameHeight: feedback.frameHeight,
    recording,
  });
}

export type GetTrelloCardDescriptionOutput = Awaited<
  ReturnType<typeof getTrelloCardDescription>
>;
