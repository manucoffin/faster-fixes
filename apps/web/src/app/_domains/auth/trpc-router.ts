import { DomainError } from "@/server/errors/domain-errors";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { registerUser } from "./_services/register-user";
import { RegisterUserSchema } from "./_services/register-user.schema";
import { requestPasswordReset } from "./_services/request-password-reset";
import { RequestPasswordResetSchema } from "./_services/request-password-reset.schema";
import { resetPassword } from "./_services/reset-password";
import { ResetPasswordSchema } from "./_services/reset-password.schema";
import { sendVerificationEmail } from "./_services/send-verification-email";
import { SendVerificationEmailSchema } from "./_services/send-verification-email.schema";
import { signInUser } from "./_services/sign-in-user";
import { SignInUserSchema } from "./_services/sign-in-user.schema";
import { stopImpersonate } from "./_services/stop-impersonate";

export const authRouter = router({
  signInUser: publicProcedure
    .input(SignInUserSchema)
    .mutation(async ({ input }) => {
      try {
        return await signInUser(input);
      } catch (error) {
        if (error instanceof DomainError) {
          throw error;
        }

        // Identity failures have no domain error: they are answered at the
        // transport edge, where the credentials were presented.
        if (
          error instanceof Error &&
          (error.message.includes("Invalid") ||
            error.message.includes("password"))
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        console.error("[sign-in-user] Unexpected error:", error);
        throw error;
      }
    }),

  registerUser: publicProcedure
    .input(RegisterUserSchema)
    .mutation(({ input }) => registerUser(input)),

  requestPasswordReset: publicProcedure
    .input(RequestPasswordResetSchema)
    .mutation(async ({ input }) =>
      requestPasswordReset({ email: input.email, headers: await headers() }),
    ),

  resetPassword: publicProcedure
    .input(ResetPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        return await resetPassword({
          token: input.token,
          password: input.password,
          headers: await headers(),
        });
      } catch (error) {
        if (error instanceof DomainError) {
          throw error;
        }

        // Same rule as sign-in: a rejected reset token is an identity failure.
        if (
          error instanceof Error &&
          (error.message.includes("Invalid") ||
            error.message.includes("token") ||
            error.message.includes("expired"))
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "The reset link is invalid or has expired.",
          });
        }

        throw error;
      }
    }),

  sendVerificationEmail: publicProcedure
    .input(SendVerificationEmailSchema)
    .mutation(async ({ input }) =>
      sendVerificationEmail({ email: input.email, headers: await headers() }),
    ),

  stopImpersonate: protectedProcedure.mutation(async ({ ctx }) => {
    // Answerable from the session alone, so it stays at the transport edge.
    if (!ctx.session?.session?.impersonatedBy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not currently impersonating",
      });
    }

    return stopImpersonate({ headers: await headers() });
  }),
});
