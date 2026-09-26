import { checkResourceLimit } from "@/server/auth/subscription";
import { prisma } from "@workspace/db";

/**
 * Whether the Organization may record one more Feedback under its Plan, with
 * the counters the widget API answers with when it may not. A Plan limit is not
 * a domain error here: the refusal body carries `current` and `limit`, so it
 * comes back as data and the route keeps its own contract.
 */
export async function getFeedbackCapacity(organizationId: string) {
  const check = await checkResourceLimit(organizationId, "feedbacks", prisma);

  if (check.allowed) return { allowed: true as const };

  const { metadata } = check.denial;
  return {
    allowed: false as const,
    current: metadata.current,
    limit: metadata.limit,
  };
}

export type GetFeedbackCapacityOutput = Awaited<
  ReturnType<typeof getFeedbackCapacity>
>;
