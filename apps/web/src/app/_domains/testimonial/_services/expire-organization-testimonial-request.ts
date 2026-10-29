import { inngest } from "@/server/inngest";
import {
  buildEvent,
  testimonialRequestClosedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";

import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

/**
 * Runs before an Organization is deleted: its still-`pending` request is
 * closed as `expired` and the sequence is told to stop. Closed requests are
 * left as they are, so the Organization's history survives the deletion.
 */
export async function expireOrganizationTestimonialRequest(
  { organizationId, now }: { organizationId: string; now: Date },
  db: typeof prisma = prisma,
) {
  // updateMany so the status guard and the write are one statement: a request
  // submitted a moment earlier is not overwritten.
  const { count } = await db.testimonialRequest.updateMany({
    where: {
      organizationId,
      status: TestimonialRequestStatusEnum.enum.pending,
    },
    data: {
      status: TestimonialRequestStatusEnum.enum.expired,
      closedAt: now,
    },
  });

  if (count === 0) return null;

  const request = await db.testimonialRequest.findUnique({
    where: { organizationId },
    select: { id: true },
  });
  if (!request) return null;

  // Never block the deletion on Inngest: the reminder step reloads the
  // request and stops on its own once it is no longer `pending`.
  await inngest
    .send(buildEvent(testimonialRequestClosedEvent, { requestId: request.id }))
    .catch((error: unknown) => {
      console.error("Failed to emit testimonial/request.closed", {
        requestId: request.id,
        error,
      });
    });

  return { requestId: request.id };
}

export type ExpireOrganizationTestimonialRequestOutput = Awaited<
  ReturnType<typeof expireOrganizationTestimonialRequest>
>;
