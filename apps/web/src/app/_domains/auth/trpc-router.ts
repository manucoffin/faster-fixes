import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
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
    .mutation(({ input }) => signInUser(input)),

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
    .mutation(async ({ input }) =>
      resetPassword({
        token: input.token,
        password: input.password,
        headers: await headers(),
      }),
    ),

  sendVerificationEmail: publicProcedure
    .input(SendVerificationEmailSchema)
    .mutation(async ({ input }) =>
      sendVerificationEmail({ email: input.email, headers: await headers() }),
    ),

  stopImpersonate: protectedProcedure.mutation(async () =>
    stopImpersonate({ headers: await headers() }),
  ),
});
