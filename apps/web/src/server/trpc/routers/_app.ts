import { authRouter } from "@/app/(auth)/_utils/trpc-router";
import { authenticatedRouter } from "@/app/(authenticated)/_utils/trpc-router";
import { adminRouter } from "@/app/admin/_utils/trpc-router";
import { router } from "../trpc";

export const appRouter = router({
  auth: authRouter,
  authenticated: authenticatedRouter,
  admin: adminRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
