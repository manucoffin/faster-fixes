import { TEST_RECIPIENT_EMAIL } from "@/app/_constants/emails";
import { mailer } from "@/lib/mailer/client";
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
      select: { type: true },
    });

    if (!dbUser) {
      throw Error("Cet utilisateur n'existe pas.");
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const from = process.env.SENDER_EMAIL;
    const to =
      process.env.NODE_ENV === "production"
        ? normalizedEmail
        : TEST_RECIPIENT_EMAIL;

    if (!from) {
      throw new Error("No sender email configured");
    }

    await mailer.emails.send({
      from,
      to,
      subject: "Plus qu'une patte à franchir !",
      params: {
        verificationLink: url,
      },
    });
  },
};
