import { inngest } from "@/server/inngest";
import {
  buildEvent,
  testimonialRequestClosedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

/**
 * Opts the User out of the Testimonial request after the confirmation click on
 * the decline page. Anything but an open `pending` request is a no-op reported
 * as `handled`, so the page can say so without an error.
 */
export async function declineTestimonialRequest(
  { token, now }: { token: string; now: Date },
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { token },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!request) return { status: "handled" as const };

  const state = getTestimonialRequestState(request, now);
  const pending = {
    id: request.id,
    status: TestimonialRequestStatusEnum.enum.pending,
  };

  if (state === "lapsed") {
    await db.testimonialRequest.updateMany({
      where: pending,
      data: {
        status: TestimonialRequestStatusEnum.enum.expired,
        closedAt: now,
      },
    });
  }

  if (state !== "open") return { status: "handled" as const };

  // Guarded on `pending` so a submission landing at the same moment wins.
  const { count } = await db.testimonialRequest.updateMany({
    where: pending,
    data: {
      status: TestimonialRequestStatusEnum.enum.declined,
      closedAt: now,
    },
  });

  if (count === 0) return { status: "handled" as const };

  // The decline is stored, so an Inngest failure is logged rather than
  // surfaced: the reminder step reloads the request and stops on its own.
  await inngest
    .send(buildEvent(testimonialRequestClosedEvent, { requestId: request.id }))
    .catch((error: unknown) => {
      console.error("Failed to emit testimonial/request.closed", {
        requestId: request.id,
        error,
      });
    });

  return { status: "declined" as const };
}

export type DeclineTestimonialRequestOutput = Awaited<
  ReturnType<typeof declineTestimonialRequest>
>;
