import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL, TEST_RECIPIENT_EMAIL } from "@/lib/mailer/constants";
import { VerifyEmail } from "@/lib/mailer/templates/verify-email";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";
import type { BetterAuthOptions } from "better-auth";

export const emailVerification: NonNullable<
  BetterAuthOptions["emailVerification"]
> = {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  afterEmailVerification: async () => {
    // The middleware will automatically redirect to onboarding since the user
    // will have autoSignInAfterVerification=true but onboardingCompleted=false
  },
  sendVerificationEmail: async ({ user, url }, ctx) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw Error("Cet utilisateur n'existe pas.");
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const from = SENDER_EMAIL;
    const to =
      process.env.NODE_ENV === "production"
        ? normalizedEmail
        : TEST_RECIPIENT_EMAIL;
    const body = await render(<VerifyEmail verificationLink={url} />);

    await mailer.emails.send({
      from,
      to,
      subject: "Plus qu'une patte à franchir !",
      body,
      params: {
        verificationLink: url,
      },
    });
  },
};
