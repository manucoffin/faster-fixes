import { mailer } from "@/lib/mailer/client";
import { COMMERCIAL_SENDER_EMAIL } from "@/lib/mailer/constants";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";

import { getTestimonialRequestEmail } from "./get-testimonial-request-email";
import { TestimonialRequestStatusEnum } from "../_helpers/testimonial-request-status";

const DAY_MS = 24 * 60 * 60 * 1000;
const TESTIMONIAL_REQUEST_EXPIRY_DAYS = 30;

type SendTestimonialRequestEmailParams = {
  requestId: string;
  kind: "first" | "reminder";
  now: Date;
};

/**
 * Sends one email of the Testimonial request sequence and stamps it on the
 * request. Sends nothing once the request has left `pending`, lost its User
 * or Organization, or already carries the stamp, so a retried step never
 * sends the same email twice.
 */
export async function sendTestimonialRequestEmail(
  { requestId, kind, now }: SendTestimonialRequestEmailParams,
  db: typeof prisma = prisma,
) {
  const request = await db.testimonialRequest.findUnique({
    where: { id: requestId },
    select: {
      token: true,
      status: true,
      feedbackCount: true,
      firstEmailSentAt: true,
      reminderSentAt: true,
      organization: { select: { id: true, name: true } },
      user: {
        select: {
          email: true,
          name: true,
          profile: { select: { firstName: true } },
        },
      },
    },
  });

  if (!request) return { sent: false, reason: "not_found" } as const;

  const { user, organization } = request;
  if (request.status !== TestimonialRequestStatusEnum.enum.pending) {
    return { sent: false, reason: "not_pending" } as const;
  }
  if (!user || !organization) {
    return { sent: false, reason: "detached" } as const;
  }

  const alreadySent =
    kind === "first" ? request.firstEmailSentAt : request.reminderSentAt;
  if (alreadySent) return { sent: false, reason: "already_sent" } as const;

  const firstName = user.profile?.firstName?.trim() ?? "";
  const email = await getTestimonialRequestEmail({
    kind,
    appUrl: getAppUrl(),
    token: request.token,
    recipientName: firstName !== "" ? firstName : user.name,
    feedbackCount: request.feedbackCount,
    organizationName: organization.name,
  });

  await mailer.emails.send({
    from: COMMERCIAL_SENDER_EMAIL,
    to: user.email.toLowerCase().trim(),
    subject: email.subject,
    body: email.body,
  });

  await db.testimonialRequest.update({
    where: { id: requestId },
    data:
      kind === "first"
        ? {
            firstEmailSentAt: now,
            expiresAt: new Date(
              now.getTime() + TESTIMONIAL_REQUEST_EXPIRY_DAYS * DAY_MS,
            ),
          }
        : { reminderSentAt: now },
  });

  return { sent: true, organizationId: organization.id } as const;
}

export type SendTestimonialRequestEmailOutput = Awaited<
  ReturnType<typeof sendTestimonialRequestEmail>
>;
