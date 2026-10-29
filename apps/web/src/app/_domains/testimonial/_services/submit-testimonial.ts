import { PreconditionFailedError } from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  testimonialRequestClosedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";
import { TestimonialStatusEnum } from "../_helpers/testimonial-status";
import type { SubmitTestimonialInput } from "./submit-testimonial.schema";

// Every refusal of the token is PRECONDITION_FAILED, and nothing else this
// service throws is, so the form branches on the code to show the expired page.
const LINK_EXPIRED_MESSAGE =
  "This link no longer works. Reply to the email you received to share your experience.";

/**
 * Stores the Testimonial a User submits through the request link, awaiting
 * review. The author fields are a snapshot of what the User submitted, and the
 * token is single-use: the request leaves `pending` in the same transaction.
 */
export async function submitTestimonial(
  {
    token,
    now,
    testimonial,
  }: { token: string; now: Date; testimonial: SubmitTestimonialInput },
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      userId: true,
      organizationId: true,
    },
  });

  if (!request) throw new PreconditionFailedError(LINK_EXPIRED_MESSAGE);

  const state = getTestimonialRequestState(request, now);

  if (state === "lapsed") {
    await db.testimonialRequest.updateMany({
      where: {
        id: request.id,
        status: TestimonialRequestStatusEnum.enum.pending,
      },
      data: {
        status: TestimonialRequestStatusEnum.enum.expired,
        closedAt: now,
      },
    });
  }

  const { userId, organizationId } = request;
  if (state !== "open" || !userId || !organizationId) {
    throw new PreconditionFailedError(LINK_EXPIRED_MESSAGE);
  }

  const created = await db.$transaction(async (tx) => {
    // Guarded on `pending` so two submissions racing on one token store one
    // Testimonial.
    const { count } = await tx.testimonialRequest.updateMany({
      where: {
        id: request.id,
        status: TestimonialRequestStatusEnum.enum.pending,
      },
      data: {
        status: TestimonialRequestStatusEnum.enum.submitted,
        closedAt: now,
      },
    });
    if (count === 0) return null;

    return tx.testimonial.create({
      data: {
        rating: testimonial.rating,
        text: testimonial.text,
        authorName: testimonial.name,
        authorTitle: testimonial.title === "" ? null : testimonial.title,
        organizationName: testimonial.organization,
        websiteUrl: testimonial.website === "" ? null : testimonial.website,
        status: TestimonialStatusEnum.enum.pending,
        statusChangedAt: now,
        consentAt: now,
        testimonialRequestId: request.id,
        userId,
        organizationId,
      },
      select: {
        id: true,
        rating: true,
        text: true,
        authorName: true,
        authorTitle: true,
        organizationName: true,
        websiteUrl: true,
      },
    });
  });

  if (!created) throw new PreconditionFailedError(LINK_EXPIRED_MESSAGE);

  // The submission is stored, so an Inngest failure is logged rather than
  // surfaced: the reminder step reloads the request and stops on its own.
  await inngest
    .send(buildEvent(testimonialRequestClosedEvent, { requestId: request.id }))
    .catch((error: unknown) => {
      console.error("Failed to emit testimonial/request.closed", {
        requestId: request.id,
        error,
      });
    });

  return created;
}

export type SubmitTestimonialOutput = Awaited<
  ReturnType<typeof submitTestimonial>
>;
