import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL } from "@/lib/mailer/constants";
import { ResetPassword } from "@/lib/mailer/templates/reset-password";
import { PreconditionFailedError } from "@/server/errors/domain-errors";
import { render } from "@react-email/components";
import type { BetterAuthOptions } from "better-auth";

export const emailAndPassword: NonNullable<
  BetterAuthOptions["emailAndPassword"]
> = {
  enabled: true,
  requireEmailVerification: true,
  autoSignIn: true,

  sendResetPassword: async ({ user, url }) => {
    try {
      const normalizedEmail = user.email.toLowerCase().trim();
      const from = SENDER_EMAIL;
      const body = await render(<ResetPassword resetPasswordLink={url} />);

      await mailer.emails.send({
        from,
        to: normalizedEmail,
        subject: "Password reset",
        body,
      });
    } catch (error) {
      console.error("Error sending reset password email:", error);
      // The only user copy thrown under `src/server`: a domain error so the
      // step 4 masking of INTERNAL_SERVER_ERROR cannot swallow this sentence.
      throw new PreconditionFailedError(
        "Failed to send the password reset email. Please try again.",
        { cause: error },
      );
    }
  },
};
