import { SENDER_EMAIL, TEST_RECIPIENT_EMAIL } from "@/app/_constants/emails";
import { ResetPasswordEmail } from "@/emails/templates/reset-password";
import { mailer } from "@/lib/mailer/client";
import { render } from "@react-email/components";
import { compare } from "bcryptjs";
import { BetterAuthOptions } from "better-auth";
import { verifyPassword } from "better-auth/crypto";

export const emailAndPassword: NonNullable<
  BetterAuthOptions["emailAndPassword"]
> = {
  enabled: true,
  requireEmailVerification: true,
  password: {
    // Verify passwords - supports both bcrypt (legacy NextAuth) and scrypt (Better Auth)
    verify: async ({ hash: storedHash, password }) => {
      // Detect bcrypt hash format (NextAuth legacy)
      if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
        return await compare(password, storedHash);
      }

      // Otherwise, verify with scrypt (Better Auth default)
      return await verifyPassword({ hash: storedHash, password });
    },
  },
  sendResetPassword: async ({ user, url, token }, request) => {
    // Check for guest flow via query parameter in the redirect URL
    // const isGuestAccountFlow = request?.url.includes("isGuest=true");
    const isGuestAccountFlow =
      request?.headers.get("x-guest-account-flow") === "true";

    try {
      const from = SENDER_EMAIL;
      const to =
        process.env.NODE_ENV === "production"
          ? user.email
          : TEST_RECIPIENT_EMAIL;

      let body: string;
      let subject: string;

      if (isGuestAccountFlow) {
        // For guest users, send welcome email with password creation
        await mailer.emails.send({
          from,
          to,
          subject: "Crée ton mot de passe sur Tobalgo",
          templateId: 22,
          params: {
            resetPasswordLink: url,
          },
        });
      } else {
        // For existing users, send standard password reset email
        body = await render(<ResetPasswordEmail resetPasswordLink={url} />);

        await mailer.emails.send({
          from,
          to,
          subject: "Réinitialisation de mot de passe",
          body,
        });
      }
    } catch (error: any) {
      console.error(
        "Error sending reset password email:",
        error?.message || error,
      );
      throw new Error(
        "Erreur lors de l'envoi de l'email de réinitialisation. Veuillez réessayer.",
      );
    }
  },
};
