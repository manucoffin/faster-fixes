/**
 * The review API's Reviewer claim: a browser binds a name on the Video to the
 * secret it generated, sent in `x-reviewer-token`. Asked once, at the first
 * Post.
 */

import { ConflictError } from "@/server/errors/domain-errors";
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
} from "../../_helpers/review-error";
import { claimVideoReviewer } from "../../_services/claim-video-reviewer";
import { ClaimVideoReviewerSchema } from "../../_services/claim-video-reviewer.schema";
import { findSharedVideo } from "../../_services/find-shared-video";

type RouteParams = { params: Promise<{ secret: string }> };

// POST /api/v1/review/:secret/reviewers — claim a name on the Video
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { secret } = await params;

  const video = await findSharedVideo(secret);
  if (!video) return reviewLinkNotFound();

  const rateLimit = await checkRateLimit(video.id, "submit");
  if (!rateLimit.allowed) return reviewRateLimitResponse(rateLimit);

  if (!video.annotationsOpen) return reviewAnnotationsClosed();

  const reviewerSecret = req.headers.get("x-reviewer-token");
  if (!reviewerSecret) return reviewReviewerRequired();

  const parsed = ClaimVideoReviewerSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) return reviewInvalidRequest(parsed.error);

  try {
    const { created, reviewer } = await claimVideoReviewer({
      videoId: video.id,
      projectId: video.projectId,
      name: parsed.data.name,
      secret: reviewerSecret,
    });
    return NextResponse.json({ reviewer }, { status: created ? 201 : 200 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return reviewError(error.message, "name_taken", 409);
    }
    throw error;
  }
}
