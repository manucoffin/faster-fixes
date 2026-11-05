import type { CreateVideoFeedbackInput } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { inngest } from "@/server/inngest";
import { buildEvent, feedbackCreatedEvent } from "@/server/inngest/events";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { toReviewFeedbackItem } from "../_helpers/to-review-feedback-item";

type CreateVideoFeedbackServiceInput = {
  projectId: string;
  videoId: string;
  reviewerId: string;
  /** Set only when the page sent a Screenshot and its upload succeeded. */
  screenshotId?: string;
  data: CreateVideoFeedbackInput;
};

/**
 * Records a Feedback a Reviewer posted on the review page and announces it to
 * the Integrations, like a Widget Feedback. The caller has already resolved
 * the Video, the Reviewer, open annotations and the Plan limit.
 */
export async function createVideoFeedback({
  projectId,
  videoId,
  reviewerId,
  screenshotId,
  data,
}: CreateVideoFeedbackServiceInput) {
  const frame = data.point ?? data.area;

  const { screenshot, ...row } = await prisma.feedback.create({
    data: {
      projectId,
      videoId,
      reviewerId,
      comment: data.comment,
      pageUrl: null,
      startMs: data.startMs,
      endMs: data.endMs,
      frameX: frame?.x ?? null,
      frameY: frame?.y ?? null,
      frameWidth: data.area?.width ?? null,
      frameHeight: data.area?.height ?? null,
      browserName: data.browserName,
      browserVersion: data.browserVersion,
      os: data.os,
      viewportWidth: data.viewportWidth,
      viewportHeight: data.viewportHeight,
      screenshotId,
    },
    select: {
      id: true,
      status: true,
      comment: true,
      pageUrl: true,
      clickX: true,
      clickY: true,
      selector: true,
      metadata: true,
      createdAt: true,
      startMs: true,
      endMs: true,
      frameX: true,
      frameY: true,
      frameWidth: true,
      frameHeight: true,
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true } },
    },
  });

  // Fire-and-forget: a Tracker or a Notification channel that is slow or down
  // must not hold up the page's answer.
  inngest
    .send(buildEvent(feedbackCreatedEvent, { feedbackId: row.id }))
    .catch(() => {});

  return toReviewFeedbackItem(
    row,
    screenshot ? await getSignedAssetUrl(screenshot) : null,
  );
}

export type CreateVideoFeedbackOutput = Awaited<
  ReturnType<typeof createVideoFeedback>
>;
