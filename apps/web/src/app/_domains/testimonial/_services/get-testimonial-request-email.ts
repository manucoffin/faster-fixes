import {
  TestimonialRequestReminderEmail,
  type TestimonialRequestReminderEmailProps,
} from "@/lib/mailer/templates/testimonial-request-reminder";
import {
  TestimonialRequestEmail,
  type TestimonialRequestEmailProps,
} from "@/lib/mailer/templates/testimonial-request";
import { render } from "@react-email/components";
import { createElement } from "react";

import { getTestimonialRequestUrls } from "../_helpers/get-testimonial-request-urls";

type GetTestimonialRequestEmailParams = {
  kind: "first" | "reminder";
  appUrl: string;
  token: string;
  recipientName?: string;
  feedbackCount: number;
  organizationName: string;
};

export async function getTestimonialRequestEmail({
  kind,
  appUrl,
  token,
  recipientName,
  feedbackCount,
  organizationName,
}: GetTestimonialRequestEmailParams) {
  const urls = getTestimonialRequestUrls(appUrl, token);

  if (kind === "reminder") {
    return {
      subject: "re: a small favor",
      body: await render(
        createElement<TestimonialRequestReminderEmailProps>(
          TestimonialRequestReminderEmail,
          { recipientName, ...urls },
        ),
      ),
    };
  }

  return {
    subject: "a small favor",
    body: await render(
      createElement<TestimonialRequestEmailProps>(TestimonialRequestEmail, {
        recipientName,
        feedbackCount,
        organizationName,
        ...urls,
      }),
    ),
  };
}

export type GetTestimonialRequestEmailOutput = Awaited<
  ReturnType<typeof getTestimonialRequestEmail>
>;
