import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL, TEST_RECIPIENT_EMAIL } from "@/lib/mailer/constants";
import { ResetPassword } from "@/lib/mailer/templates/reset-password";
import { render } from "@react-email/components";
import { BetterAuthOptions } from "better-auth";

export const emailAndPassword: NonNullable<
  BetterAuthOptions["emailAndPassword"]
> = {
  enabled: true,
  requireEmailVerification: true,
  autoSignIn: false,

  sendResetPassword: async ({ user, url, token }, request) => {
    try {
      const normalizedEmail = user.email.toLowerCase().trim();
      const from = SENDER_EMAIL;
      const to =
        process.env.NODE_ENV === "production"
          ? normalizedEmail
          : TEST_RECIPIENT_EMAIL;
      const body = await render(<ResetPassword resetPasswordLink={url} />);

      await mailer.emails.send({
        from,
        to,
        subject: "Réinitialisation de mot de passe",
        body,
      });
    } catch (error) {
      console.error(
        "Error sending reset password email:",
        error,
      );
      throw new Error(
        "Erreur lors de l'envoi de l'email de réinitialisation. Veuillez réessayer.",
      );
    }
  },
};
