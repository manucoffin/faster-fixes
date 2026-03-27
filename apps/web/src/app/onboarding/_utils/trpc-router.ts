import { router } from "@/server/trpc/trpc";
import {
  completeOnboarding,
  createOnboardingProject,
} from "../_features/onboarding-wizard/complete-onboarding.trpc.mutation";

export const onboardingRouter = router({
  createProject: createOnboardingProject,
  complete: completeOnboarding,
});
