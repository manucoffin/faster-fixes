import { inngest } from "@/server/inngest";
import { buildEvent, feedbackCreatedEvent } from "@/server/inngest/events";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import type { CreateFeedbackInput } from "./create-feedback.schema";

type CreateFeedbackServiceInput = {
  projectId: string;
  reviewerId: string;
  /** Set only when the widget sent a screenshot and its upload succeeded. */
  screenshotId?: string;
  data: CreateFeedbackInput;
};

/**
 * Records a Feedback a Reviewer submitted through the widget and announces it
 * to the Integrations. The caller has already resolved the Project, matched the
 * origin, checked the Reviewer token and the Plan limit, so this write applies
 * no access rule of its own.
 */
export async function createFeedback({
  projectId,
  reviewerId,
  screenshotId,
  data,
}: CreateFeedbackServiceInput) {
  const feedback = await prisma.feedback.create({
    data: {
      projectId,
      reviewerId,
      comment: data.comment,
      pageUrl: data.pageUrl,
      clickX: data.clickX,
      clickY: data.clickY,
      selector: data.selector,
      browserName: data.browserName,
      browserVersion: data.browserVersion,
      os: data.os,
      viewportWidth: data.viewportWidth,
      viewportHeight: data.viewportHeight,
      metadata: data.metadata,
      diagnosticTrail: data.diagnosticTrail,
      screenshotId,
    },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  // Fire-and-forget: a Tracker or a Notification channel that is slow or down
  // must not hold up the widget's answer.
  inngest
    .send(buildEvent(feedbackCreatedEvent, { feedbackId: feedback.id }))
    .catch(() => {});

  const screenshotUrl = feedback.screenshot
    ? await getSignedAssetUrl(feedback.screenshot)
    : null;

  return {
    id: feedback.id,
    status: feedback.status,
    comment: feedback.comment,
    pageUrl: feedback.pageUrl,
    clickX: feedback.clickX,
    clickY: feedback.clickY,
    selector: feedback.selector,
    screenshotUrl,
    metadata: feedback.metadata,
    reviewer: feedback.reviewer,
    createdAt: feedback.createdAt,
  };
}

export type CreateFeedbackOutput = Awaited<ReturnType<typeof createFeedback>>;
