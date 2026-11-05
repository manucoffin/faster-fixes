import type { RateLimitResult } from "@/server/rate-limit/check-rate-limit";
import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * The review API's error responses: a JSON `{ error, code }` body with the
 * lowercase codes the review page branches on, written once for every review
 * route rather than per handler (ADR-0012).
 */
export function reviewError(
  message: string,
  code: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: message, code }, { status, headers });
}

export function reviewLinkNotFound(): NextResponse {
  return reviewError("This link no longer works.", "link_not_found", 404);
}

/** A body the route's schema refused, answered with the first issue's message. */
export function reviewInvalidRequest(error: z.ZodError): NextResponse {
  return reviewError(
    error.issues[0]?.message ?? "The request is invalid.",
    "invalid_request",
    400,
  );
}

export function reviewReviewerRequired(): NextResponse {
  return reviewError(
    "Pick a name before commenting on this video.",
    "reviewer_required",
    401,
  );
}

export function reviewAnnotationsClosed(): NextResponse {
  return reviewError(
    "Annotations are closed on this video.",
    "annotations_closed",
    403,
  );
}

/** The 429 of a refused rate limit, with the agent API's retry headers. */
export function reviewRateLimitResponse(result: RateLimitResult): NextResponse {
  return reviewError(
    `Rate limit exceeded. Retry after ${result.retryAfterSeconds} seconds.`,
    "rate_limited",
    429,
    {
      "Retry-After": String(result.retryAfterSeconds),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    },
  );
}

/**
 * The Plan's Feedback cap, refused with the Widget's body as it stands, so
 * one cap answers the same on both surfaces.
 */
export function reviewFeedbackLimitReached(capacity: {
  current: number;
  limit: number;
}): NextResponse {
  return NextResponse.json(
    {
      error: "Feedback limit reached for this organization's plan.",
      code: "RESOURCE_LIMIT_EXCEEDED",
      current: capacity.current,
      limit: capacity.limit,
    },
    { status: 403 },
  );
}
