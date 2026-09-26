import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL } from "@/lib/mailer/constants";
import { VerifyEmail } from "@/lib/mailer/templates/verify-email";
import { inngest } from "@/server/inngest";
import { buildEvent, userEmailVerifiedEvent } from "@/server/inngest/events";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";
import type { BetterAuthOptions } from "better-auth";

export const emailVerification: NonNullable<
  BetterAuthOptions["emailVerification"]
> = {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  afterEmailVerification: async (user) => {
    // The middleware will automatically redirect to onboarding since the user
    // will have autoSignInAfterVerification=true but onboardingCompleted=false

    // Hand off the welcome email to Inngest so a mailer outage can't fail
    // verification, and delivery is retried independently.
    await inngest.send(buildEvent(userEmailVerifiedEvent, { userId: user.id }));
  },
  sendVerificationEmail: async ({ user, url }) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw Error("This user does not exist.");
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const from = SENDER_EMAIL;
    const body = await render(<VerifyEmail verificationLink={url} />);

    await mailer.emails.send({
      from,
      to: normalizedEmail,
      subject: "Verify your email",
      body,
    });
  },
};
