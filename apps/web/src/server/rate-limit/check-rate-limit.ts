import { prisma } from "@workspace/db";
import crypto from "crypto";

type RateLimitConfig = {
  /** Max requests allowed within the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

const RATE_LIMITS = {
  submit: { max: 100, windowMs: 3_600_000 } satisfies RateLimitConfig,
  read: { max: 1000, windowMs: 3_600_000 } satisfies RateLimitConfig,
  // Agent ceilings are plan-tiered (see AGENT_API_RATE_LIMITS); the `max` here
  // is only a fallback and is overridden per request via `overrideMax`.
  "agent:read": { max: 1000, windowMs: 3_600_000 } satisfies RateLimitConfig,
  "agent:write": { max: 120, windowMs: 3_600_000 } satisfies RateLimitConfig,
  trpc: { max: 300, windowMs: 60_000 } satisfies RateLimitConfig,
} as const;

type RateLimitAction = keyof typeof RATE_LIMITS;

export type RateLimitResult = {
  allowed: boolean;
  /** Effective ceiling applied (after any plan override) */
  limit: number;
  /** Requests left in the current window (0 when blocked) */
  remaining: number;
  /** Epoch ms when the current window expires */
  resetAt: number;
  /** Seconds to wait before retrying (0 when allowed) */
  retryAfterSeconds: number;
};

/**
 * Checks rate limit per bucket key (project id, org id, or user id) for a given
 * action. The increment is atomic: a single conditional upsert decides reset
 * vs. increment vs. block, so concurrent callers (e.g. parallel agent writes)
 * can't both slip past the ceiling. Fixed window anchored at the first request
 * — `lastRequest` stores the window start and only moves on reset.
 *
 * `overrideMax` lets callers supply a per-request ceiling (used for plan-tiered
 * agent limits) while reusing the action's window.
 */
export async function checkRateLimit(
  bucketKey: string,
  action: RateLimitAction,
  overrideMax?: number,
): Promise<RateLimitResult> {
  const { max: defaultMax, windowMs } = RATE_LIMITS[action];
  const max = overrideMax ?? defaultMax;
  const key = `v1:${action}:${bucketKey}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const id = crypto.randomUUID();

  const rows = await prisma.$queryRaw<{ count: number; lastRequest: bigint }[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${id}, ${key}, 1, ${BigInt(now)})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rateLimit"."lastRequest" < ${BigInt(windowStart)} THEN 1
        ELSE "rateLimit"."count" + 1
      END,
      "lastRequest" = CASE
        WHEN "rateLimit"."lastRequest" < ${BigInt(windowStart)} THEN ${BigInt(now)}
        ELSE "rateLimit"."lastRequest"
      END
    RETURNING "count", "lastRequest";
  `;

  const row = rows[0];
  if (!row) {
    // The upsert always returns the affected row; this is unreachable and only
    // narrows the type. Fail open rather than block a legitimate caller.
    return {
      allowed: true,
      limit: max,
      remaining: max - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }
  const count = Number(row.count);
  const windowAnchor = Number(row.lastRequest);
  const resetAt = windowAnchor + windowMs;
  const allowed = count <= max;

  return {
    allowed,
    limit: max,
    remaining: Math.max(0, max - count),
    resetAt,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}
