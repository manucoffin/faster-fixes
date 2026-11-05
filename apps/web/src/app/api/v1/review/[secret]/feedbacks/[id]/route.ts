/**
 * The review API's edit and withdrawal of one Feedback: a Reviewer rewrites
 * or deletes their own Feedback while it is still `new`. Any other Feedback
 * answers 404, so the routes never disclose whose a Feedback is.
 */

import { UpdateVideoFeedbackSchema } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  reviewAnnotationsClosed,
  reviewError,
  reviewInvalidRequest,
  reviewLinkNotFound,
  reviewRateLimitResponse,
  reviewReviewerRequired,
} from "../../../_helpers/review-error";
import { deleteVideoFeedback } from "../../../_services/delete-video-feedback";
import { findOwnNewVideoFeedback } from "../../../_services/find-own-new-video-feedback";
import { findSharedVideo } from "../../../_services/find-shared-video";
import { findVideoReviewer } from "../../../_services/find-video-reviewer";
import { updateVideoFeedbackComment } from "../../../_services/update-video-feedback-comment";

type RouteParams = { params: Promise<{ secret: string; id: string }> };

function feedbackNotFound() {
  return reviewError("This Feedback was not found.", "feedback_not_found", 404);
}

/**
 * The checks both verbs share, in order: link, `submit` rate limit, open
 * annotations, Reviewer, then the Feedback. Answers the refusal, or the
 * Feedback the caller may write.
 */
async function resolveOwnNewFeedback(req: NextRequest, params: RouteParams) {
  const { secret, id } = await params.params;

  const video = await findSharedVideo(secret);
  if (!video) return { refusal: reviewLinkNotFound(), feedback: null };

  const rateLimit = await checkRateLimit(video.id, "submit");
  if (!rateLimit.allowed) {
    return { refusal: reviewRateLimitResponse(rateLimit), feedback: null };
  }

  if (!video.annotationsOpen) {
    return { refusal: reviewAnnotationsClosed(), feedback: null };
  }

  const reviewer = await findVideoReviewer(
    req.headers.get("x-reviewer-token"),
    video.id,
  );
  if (!reviewer) return { refusal: reviewReviewerRequired(), feedback: null };

  const feedback = await findOwnNewVideoFeedback({
    feedbackId: id,
    videoId: video.id,
    reviewerId: reviewer.id,
  });
  if (!feedback) return { refusal: feedbackNotFound(), feedback: null };

  return { refusal: null, feedback };
}

// PATCH /api/v1/review/:secret/feedbacks/:id — edit own new Feedback
export async function PATCH(req: NextRequest, params: RouteParams) {
  const { refusal, feedback } = await resolveOwnNewFeedback(req, params);
  if (refusal) return refusal;

  const parsed = UpdateVideoFeedbackSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return reviewInvalidRequest(parsed.error);

  const updated = await updateVideoFeedbackComment({
    feedbackId: feedback.id,
    comment: parsed.data.comment,
  });

  return NextResponse.json(updated);
}

// DELETE /api/v1/review/:secret/feedbacks/:id — withdraw own new Feedback
export async function DELETE(req: NextRequest, params: RouteParams) {
  const { refusal, feedback } = await resolveOwnNewFeedback(req, params);
  if (refusal) return refusal;

  await deleteVideoFeedback({ feedbackId: feedback.id });

  return new NextResponse(null, { status: 204 });
}
