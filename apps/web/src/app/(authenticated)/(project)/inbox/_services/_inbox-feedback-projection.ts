import { summarizeFeedbackRecording } from "@/app/_domains/feedback/_helpers/read-cached-recording-steps";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import type { CustomMetadata } from "@fasterfixes/core";
import type { Prisma } from "@workspace/db/types";

// The inbox projection of a Feedback, shared by every read that feeds the
// detail Sheet (the Task board, the Video page) so it accepts their items as is.

export const inboxFeedbackInclude = {
  reviewer: { select: { id: true, name: true } },
  video: { select: { title: true } },
  assignee: {
    select: {
      id: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
  screenshot: {
    select: { id: true, key: true, provider: true, bucket: true },
  },
  issueLink: {
    select: {
      issueNumber: true,
      issueUrl: true,
      issueState: true,
    },
  },
  linearIssueLink: {
    select: {
      issueId: true,
      issueIdentifier: true,
      issueUrl: true,
      issueStateType: true,
    },
  },
  jiraIssueLink: {
    select: {
      issueId: true,
      issueKey: true,
      issueUrl: true,
      issueStatusCategory: true,
    },
  },
  rank: { select: { key: true } },
} satisfies Prisma.FeedbackInclude;

type InboxFeedbackRow = Prisma.FeedbackGetPayload<{
  include: typeof inboxFeedbackInclude;
}>;

export async function toInboxFeedbackItem(f: InboxFeedbackRow) {
  return {
    id: f.id,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    status: f.status,
    comment: f.comment,
    pageUrl: f.pageUrl,
    // Null on a page Feedback (ADR-0020).
    videoId: f.videoId,
    videoTitle: f.video?.title ?? null,
    startMs: f.startMs,
    endMs: f.endMs,
    frameX: f.frameX,
    frameY: f.frameY,
    frameWidth: f.frameWidth,
    frameHeight: f.frameHeight,
    clickX: f.clickX,
    clickY: f.clickY,
    selector: f.selector,
    browserName: f.browserName,
    browserVersion: f.browserVersion,
    os: f.os,
    viewportWidth: f.viewportWidth,
    viewportHeight: f.viewportHeight,
    reviewer: f.reviewer,
    assignee: f.assignee
      ? {
          id: f.assignee.id,
          name: f.assignee.user.name,
          image: f.assignee.user.image,
        }
      : null,
    screenshotUrl: f.screenshot ? await getSignedAssetUrl(f.screenshot) : null,
    metadata: f.metadata as Record<string, unknown> | null,
    customMetadata: f.customMetadata as CustomMetadata | null,
    recording: summarizeFeedbackRecording(f),
    issueLink: f.issueLink,
    linearIssueLink: f.linearIssueLink,
    jiraIssueLink: f.jiraIssueLink,
    rank: f.rank?.key ?? null,
  };
}
