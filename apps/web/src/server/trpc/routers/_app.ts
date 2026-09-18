import { authenticatedRouter } from "@/app/(authenticated)/_utils/trpc-router";
import { publicRouter } from "@/app/(public)/trpc-router";
import { authRouter } from "@/app/_domains/auth/trpc-router";
import { organizationRouter } from "@/app/_domains/organization/trpc-router";
import { subscriptionFeatureRouter } from "@/app/_domains/subscription/_utils/trpc-router";
import { adminRouter } from "@/app/admin/_utils/trpc-router";
import { onboardingRouter } from "@/app/onboarding/_utils/trpc-router";
import { router } from "../trpc";

export const appRouter = router({
  auth: authRouter,
  authenticated: authenticatedRouter,
  onboarding: onboardingRouter,
  admin: adminRouter,
  public: publicRouter,
  organization: organizationRouter,
  subscription: subscriptionFeatureRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
