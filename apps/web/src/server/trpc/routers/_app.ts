import { authRouter } from "@/app/(auth)/_utils/trpc-router";
import { authenticatedRouter } from "@/app/(authenticated)/_utils/trpc-router";
import { authenticationFeatureRouter } from "@/app/_features/auth/_utils/trpc-router";
import { subscriptionFeatureRouter } from "@/app/_features/subscription/_utils/trpc-router";
import { adminRouter } from "@/app/admin/_utils/trpc-router";
import { mergeRouters, router } from "../trpc";

export const appRouter = router({
  auth: mergeRouters(authRouter, authenticationFeatureRouter),
  authenticated: authenticatedRouter,
  admin: adminRouter,
  subscription: subscriptionFeatureRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
