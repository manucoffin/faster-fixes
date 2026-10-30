import { prisma } from "@workspace/db";

import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

/**
 * Closes every `pending` request whose expiry date has passed. The sequence
 * has long finished by then (the reminder goes out on day 7 of 30), so no
 * `request.closed` event is needed.
 */
export async function expireTestimonialRequests(
  now: Date,
  db: typeof prisma = prisma,
) {
  const { count } = await db.testimonialRequest.updateMany({
    where: {
      status: TestimonialRequestStatusEnum.enum.pending,
      expiresAt: { lte: now },
    },
    data: {
      status: TestimonialRequestStatusEnum.enum.expired,
      closedAt: now,
    },
  });

  return { expired: count };
}

export type ExpireTestimonialRequestsOutput = Awaited<
  ReturnType<typeof expireTestimonialRequests>
>;
