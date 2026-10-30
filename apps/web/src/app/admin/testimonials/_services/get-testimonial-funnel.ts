import { getTestimonialRequestState } from "@/app/_domains/testimonial/_helpers/get-testimonial-request-state";
import { TestimonialRequestStatusEnum } from "@/app/_domains/testimonial/_helpers/testimonial-request-status";
import { prisma } from "@workspace/db";

const { submitted, declined, expired } = TestimonialRequestStatusEnum.enum;

type GetTestimonialFunnelInput = {
  now: Date;
};

export async function getTestimonialFunnel(
  { now }: GetTestimonialFunnelInput,
  db: typeof prisma = prisma,
) {
  const requests = await db.testimonialRequest.findMany({
    select: {
      userId: true,
      status: true,
      firstEmailSentAt: true,
      reminderSentAt: true,
      expiresAt: true,
    },
  });

  // A row with no User marks an Organization as handled; nobody was asked.
  const asked = requests.filter((request) => request.userId !== null);

  return {
    requestsSent: asked.filter((request) => request.firstEmailSentAt).length,
    remindersSent: asked.filter((request) => request.reminderSentAt).length,
    submitted: asked.filter((request) => request.status === submitted).length,
    declined: asked.filter((request) => request.status === declined).length,
    // A lapsed request the daily cron has not closed yet is already expired.
    expired: asked.filter(
      (request) =>
        request.status === expired ||
        getTestimonialRequestState(request, now) === "lapsed",
    ).length,
  };
}

export type GetTestimonialFunnelOutput = Awaited<
  ReturnType<typeof getTestimonialFunnel>
>;
