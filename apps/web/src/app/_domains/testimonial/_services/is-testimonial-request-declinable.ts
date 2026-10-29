import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";

/**
 * Whether the decline page offers the confirmation button. A read only: mail
 * clients prefetch the link, so opening the page must change nothing.
 */
export async function isTestimonialRequestDeclinable(
  { token, now }: { token: string; now: Date },
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { token },
    select: { status: true, expiresAt: true },
  });

  return !!request && getTestimonialRequestState(request, now) === "open";
}

export type IsTestimonialRequestDeclinableOutput = Awaited<
  ReturnType<typeof isTestimonialRequestDeclinable>
>;
