import { authRouter } from "@/app/(auth)/_utils/trpc-router";
import { authenticatedRouter } from "@/app/(authenticated)/_utils/trpc-router";
import { githubStarsFeatureRouter } from "@/app/(public)/_features/github-stars/_utils/trpc-router";
import { authenticationFeatureRouter } from "@/app/_domains/auth/_utils/trpc-router";
import { organizationFeatureRouter } from "@/app/_domains/organization/_utils/trpc-router";
import { subscriptionFeatureRouter } from "@/app/_domains/subscription/_utils/trpc-router";
import { adminRouter } from "@/app/admin/_utils/trpc-router";
import { onboardingRouter } from "@/app/onboarding/_utils/trpc-router";
import { mergeRouters, router } from "../trpc";

export const appRouter = router({
  auth: mergeRouters(authRouter, authenticationFeatureRouter),
  authenticated: authenticatedRouter,
  onboarding: onboardingRouter,
  admin: adminRouter,
  githubStars: githubStarsFeatureRouter,
  organization: organizationFeatureRouter,
  subscription: subscriptionFeatureRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
