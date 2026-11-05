/**
 * The review API's Feedback create: a Reviewer posts a comment anchored to an
 * instant or a range of the Video, with an optional point or area on the frame
 * and the captured frame as its Screenshot. Multipart on the Widget pattern: a
 * `data` JSON field and an optional `screenshot` file.
 */

import { CreateVideoFeedbackSchema } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { createFeedbackScreenshot } from "@/app/_domains/feedback/_services/create-feedback-screenshot";
import { getFeedbackCapacity } from "@/app/_domains/feedback/_services/get-feedback-capacity";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  reviewAnnotationsClosed,
  reviewError,
  reviewFeedbackLimitReached,
  reviewInvalidRequest,
  reviewLinkNotFound,
  reviewRateLimitResponse,
  reviewReviewerRequired,
} from "../../_helpers/review-error";
import { createVideoFeedback } from "../../_services/create-video-feedback";
import { findSharedVideo } from "../../_services/find-shared-video";
import { findVideoReviewer } from "../../_services/find-video-reviewer";

type RouteParams = { params: Promise<{ secret: string }> };

const ALLOWED_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

function invalidRequest(message: string) {
  return reviewError(message, "invalid_request", 400);
}

// POST /api/v1/review/:secret/feedbacks — post a Feedback on the Video
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { secret } = await params;

  const video = await findSharedVideo(secret);
  if (!video) return reviewLinkNotFound();

  const rateLimit = await checkRateLimit(video.id, "submit");
  if (!rateLimit.allowed) return reviewRateLimitResponse(rateLimit);

  if (!video.annotationsOpen) return reviewAnnotationsClosed();

  const reviewer = await findVideoReviewer(
    req.headers.get("x-reviewer-token"),
    video.id,
  );
  if (!reviewer) return reviewReviewerRequired();

  // Checked before the body is read: a Project at its cap is refused without
  // uploading anything.
  const capacity = await getFeedbackCapacity(video.project.organizationId);
  if (!capacity.allowed) return reviewFeedbackLimitReached(capacity);

  const formData = await req.formData().catch(() => null);
  if (!formData) return invalidRequest("The form data is invalid.");

  const rawData = formData.get("data");
  if (typeof rawData !== "string") {
    return invalidRequest("The data field is missing.");
  }

  let json: unknown;
  try {
    json = JSON.parse(rawData);
  } catch {
    return invalidRequest("The data field is not valid JSON.");
  }

  const parsed = CreateVideoFeedbackSchema.safeParse(json);
  if (!parsed.success) return reviewInvalidRequest(parsed.error);

  // A Video without a probed duration has no bound to check against.
  if (video.durationMs !== null && parsed.data.startMs > video.durationMs) {
    return invalidRequest("The in point is past the end of the video.");
  }

  let screenshotId: string | undefined;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File) {
    if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshot.type)) {
      return invalidRequest(
        "Invalid screenshot type. Allowed: JPEG, PNG, WebP.",
      );
    }
    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      return reviewError(
        "The screenshot exceeds the 5 MB limit.",
        "screenshot_too_large",
        413,
      );
    }

    // The Screenshot is best-effort: a storage failure posts the Feedback
    // without one rather than losing the comment.
    try {
      screenshotId = await createFeedbackScreenshot({
        projectId: video.projectId,
        contentType: screenshot.type,
        body: Buffer.from(await screenshot.arrayBuffer()),
      });
    } catch (err) {
      console.error("[review] screenshot upload failed:", err);
    }
  }

  const feedback = await createVideoFeedback({
    projectId: video.projectId,
    videoId: video.id,
    reviewerId: reviewer.id,
    screenshotId,
    data: parsed.data,
  });

  return NextResponse.json(feedback, { status: 201 });
}
