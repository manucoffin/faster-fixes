import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";

/**
 * The request behind a token that may still submit, `null` otherwise. It
 * authorizes the photo upload of the public form in place of a Member session.
 */
export async function findOpenTestimonialRequest(
  { token, now }: { token: string; now: Date },
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { token },
    select: { id: true, status: true, expiresAt: true, userId: true },
  });

  if (!request?.userId) return null;
  if (getTestimonialRequestState(request, now) !== "open") return null;

  return { id: request.id };
}

export type FindOpenTestimonialRequestOutput = Awaited<
  ReturnType<typeof findOpenTestimonialRequest>
>;
