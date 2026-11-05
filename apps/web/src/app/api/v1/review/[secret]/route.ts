/**
 * The review API's read: everything the public review page needs to show a
 * Video and its Feedback, keyed by the Share link secret. No account and no
 * CORS rule: the page is same-origin.
 */

import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  reviewLinkNotFound,
  reviewRateLimitResponse,
} from "../_helpers/review-error";
import { findSharedVideo } from "../_services/find-shared-video";
import { findVideoReviewer } from "../_services/find-video-reviewer";
import { listVideoFeedbacks } from "../_services/list-video-feedbacks";

type RouteParams = { params: Promise<{ secret: string }> };

// GET /api/v1/review/:secret — the Video, its Feedback and the caller's Reviewer
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { secret } = await params;

  const video = await findSharedVideo(secret);
  if (!video) return reviewLinkNotFound();

  const rateLimit = await checkRateLimit(video.id, "read");
  if (!rateLimit.allowed) return reviewRateLimitResponse(rateLimit);

  const [reviewer, feedback, playbackUrl, posterUrl] = await Promise.all([
    findVideoReviewer(req.headers.get("x-reviewer-token"), video.id),
    listVideoFeedbacks(video.id),
    getSignedAssetUrl(video.fileAsset),
    video.posterAsset ? getSignedAssetUrl(video.posterAsset) : null,
  ]);

  return NextResponse.json({
    video: {
      id: video.id,
      title: video.title,
      durationMs: video.durationMs,
      width: video.width,
      height: video.height,
      annotationsOpen: video.annotationsOpen,
      playbackUrl,
      posterUrl,
    },
    feedback,
    reviewer,
  });
}
