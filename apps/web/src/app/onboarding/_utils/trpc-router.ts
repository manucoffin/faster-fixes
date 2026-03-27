import { router } from "@/server/trpc/trpc";
import { completeOnboarding } from "../_features/complete-onboarding/complete-onboarding.trpc.mutation";
import { createOnboardingProject } from "../_features/create-project/create-project.trpc.mutation";

export const onboardingRouter = router({
  createProject: createOnboardingProject,
  complete: completeOnboarding,
});
