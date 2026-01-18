import { authRouter } from "@/app/(auth)/_utils/trpc-router";
import { authenticatedRouter } from "@/app/(authenticated)/_utils/trpc-router";
import { publicProcedure, router } from "../trpc";

export const appRouter = router({
  auth: authRouter,
  authenticated: authenticatedRouter,
  admin: router({
    test: publicProcedure.query(() => {
      console.log("test");
    }),
  }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
