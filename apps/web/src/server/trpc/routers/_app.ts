import { publicProcedure, router } from "../trpc";

export const appRouter = router({
  admin: router({
    test: publicProcedure.query(() => {
      console.log("test");
    }),
  }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
