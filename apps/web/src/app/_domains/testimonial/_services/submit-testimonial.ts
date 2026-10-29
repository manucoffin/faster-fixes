import {
  BadRequestError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  testimonialRequestClosedEvent,
} from "@/server/inngest/events";
import { deleteStorageObject } from "@/server/storage/objects";
import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";
import { getTestimonialUploadPrefix } from "../_helpers/testimonial-photo-keys";
import { TestimonialStatusEnum } from "../_helpers/testimonial-status";
import { createTestimonialPhoto } from "./create-testimonial-photo";
import type { SubmitTestimonialInput } from "./submit-testimonial.schema";

// Every refusal of the token is PRECONDITION_FAILED, and nothing else this
// service throws is, so the form branches on the code to show the expired page.
const LINK_EXPIRED_MESSAGE =
  "This link no longer works. Reply to the email you received to share your experience.";

// Storage cleanup never fails a submission: an orphaned object is harmless.
function deleteObjectQuietly(key: string, requestId: string) {
  return deleteStorageObject({ key }).catch((error: unknown) => {
    console.error("Failed to delete a Testimonial photo object", {
      requestId,
      key,
      error,
    });
  });
}

/** The bucket key or provider URL of the image the User chose, if any. */
function getChosenImage(
  photo: SubmitTestimonialInput["photo"],
  requestId: string,
  avatar: string | null,
) {
  switch (photo.source) {
    case "none":
      return null;
    case "avatar":
      return avatar;
    case "upload": {
      // Only an object staged for this request may be copied.
      const prefix = getTestimonialUploadPrefix(requestId);
      const filename = photo.key.slice(prefix.length);
      if (!photo.key.startsWith(prefix) || !/^\w+\.\w+$/.test(filename)) {
        throw new BadRequestError("Upload your photo again.");
      }
      return photo.key;
    }
  }
}

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
      user: { select: { image: true } },
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

  const image = getChosenImage(
    testimonial.photo,
    request.id,
    request.user?.image ?? null,
  );
  const photoKey = image
    ? await createTestimonialPhoto({ requestId: request.id, image, now })
    : null;

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
        photoKey,
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
        photoKey: true,
      },
    });
  });

  if (!created) {
    if (photoKey) await deleteObjectQuietly(photoKey, request.id);
    throw new PreconditionFailedError(LINK_EXPIRED_MESSAGE);
  }

  if (testimonial.photo.source === "upload") {
    await deleteObjectQuietly(testimonial.photo.key, request.id);
  }

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
