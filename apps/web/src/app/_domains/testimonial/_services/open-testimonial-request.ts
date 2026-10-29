import { prisma } from "@workspace/db";

import { getTestimonialRequestState } from "../_helpers/get-testimonial-request-state";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

/**
 * Resolves the token of the public form link. Returns the live account data
 * the form is prefilled with, or `expired` when the link no longer works. A
 * `pending` request past its expiry date is closed as `expired` here rather
 * than waiting for the daily cron.
 */
export async function openTestimonialRequest(
  { token, now }: { token: string; now: Date },
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      user: {
        select: {
          name: true,
          image: true,
          profile: { select: { firstName: true } },
        },
      },
      organization: {
        select: {
          name: true,
          projects: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { domain: true },
          },
        },
      },
    },
  });

  if (!request) return { state: "expired" as const };

  const state = getTestimonialRequestState(request, now);

  if (state === "lapsed") {
    // Guarded on `pending` so a submission landing at the same moment wins.
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

  // A marked-as-handled row has no User, and a deleted Organization has
  // already closed its request; both are refused like any closed request.
  if (state !== "open" || !request.user || !request.organization) {
    return { state: "expired" as const };
  }

  const { user, organization } = request;
  const domain = organization.projects[0]?.domain;
  const firstName = user.profile?.firstName?.trim() ?? "";

  return {
    state: "open" as const,
    requestId: request.id,
    prefill: {
      name: firstName === "" ? user.name : firstName,
      organization: organization.name,
      website: domain ? `https://${domain}` : "",
      image: user.image,
    },
  };
}

export type OpenTestimonialRequestOutput = Awaited<
  ReturnType<typeof openTestimonialRequest>
>;
