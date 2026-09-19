import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL } from "@/lib/mailer/constants";
import {
  WelcomeEmail,
  type WelcomeEmailProps,
} from "@/lib/mailer/templates/welcome";
import { inngest } from "@/server/inngest";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";
import { createElement } from "react";

export const sendWelcomeEmail = inngest.createFunction(
  {
    id: "send-welcome-email",
    retries: 3,
    // A re-emit of the same verification must not send a second welcome email.
    idempotency: "event.data.userId",
    triggers: [{ event: "user/email-verified" }],
  },
  async ({ event }) => {
    const { userId } = event.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return { skipped: "user_not_found" };

    // createElement (not JSX) so this file stays .ts, matching the other
    // Inngest functions in this directory.
    const body = await render(
      createElement<WelcomeEmailProps>(WelcomeEmail, {
        userName: user.name ?? undefined,
      }),
    );

    await mailer.emails.send({
      from: SENDER_EMAIL,
      to: user.email.toLowerCase().trim(),
      subject: "Welcome to Faster Fixes",
      body,
    });

    return { userId };
  },
);
