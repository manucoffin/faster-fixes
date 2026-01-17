import { signOutMutation } from "@/app/_features/core/header/sign-out.trpc.mutation";
import { publicProcedure, router } from "../trpc";

export const appRouter = router({
  auth: router({
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
