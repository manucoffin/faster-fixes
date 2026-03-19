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
} as const;

type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Checks rate limit per API key for a given action.
 * Returns true if the request is allowed, false if rate-limited.
 */
export async function checkRateLimit(
  apiKeyHash: string,
  action: RateLimitAction,
): Promise<boolean> {
  const { max, windowMs } = RATE_LIMITS[action];
  const key = `v1:${action}:${apiKeyHash}`;
  const now = Date.now();

  const record = await prisma.rateLimit.upsert({
    where: { key },
    update: {},
    create: { id: crypto.randomUUID(), key, count: 0, lastRequest: BigInt(now) },
  });

  const windowStart = now - windowMs;

  if (Number(record.lastRequest) < windowStart) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, lastRequest: BigInt(now) },
    });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 }, lastRequest: BigInt(now) },
  });

  return true;
}
