import type { RateLimitResult } from "@/server/rate-limit/check-rate-limit";
import { NextResponse } from "next/server";

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
