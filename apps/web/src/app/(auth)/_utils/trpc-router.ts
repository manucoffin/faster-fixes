import { router } from "@/server/trpc/trpc";
import { loginMutation } from "../connexion/_features/login-form/login.trpc.mutation";
import { signupMutation } from "../inscription/_features/signup-form/signup.trpc.mutation";
import { forgotPasswordMutation } from "../mot-de-passe-oublie/_features/forgot-password-form/forgot-password.trpc.mutation";
import { resetPasswordMutation } from "../reinitialiser-mot-de-passe/_features/reset-password-form/reset-password.trpc.mutation";

export const authRouter = router({
  login: loginMutation,
  signup: signupMutation,
  forgotPassword: forgotPasswordMutation,
  resetPassword: resetPasswordMutation,
});
