import { forgotPasswordMutation } from "@/app/(auth)/forgot-password/_features/forgot-password-form/forgot-password.trpc.mutation";
import { loginMutation } from "@/app/(auth)/login/_features/login-form/login.trpc.mutation";
import { resetPasswordMutation } from "@/app/(auth)/reset-password/_features/reset-password-form/reset-password.trpc.mutation";
import { signupMutation } from "@/app/(auth)/signup/_features/signup-form/signup.trpc.mutation";
import { router } from "@/server/trpc/trpc";

export const authRouter = router({
  login: loginMutation,
  signup: signupMutation,
  forgotPassword: forgotPasswordMutation,
  resetPassword: resetPasswordMutation,
});
