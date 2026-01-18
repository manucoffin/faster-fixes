import { loginMutation } from "@/app/(auth)/connexion/_features/login-form/login.trpc.mutation";
import { signOutMutation } from "@/app/_features/core/header/sign-out.trpc.mutation";
import { publicProcedure, router } from "../trpc";

export const appRouter = router({
  auth: router({
    login: loginMutation,
    signout: signOutMutation,
  }),
  admin: router({
    test: publicProcedure.query(() => {
      console.log("test");
    }),
  }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
