import { protectedProcedure, router } from "@/server/trpc/trpc";
import { completeOnboarding } from "./_services/complete-onboarding";
import { createOnboardingProject } from "./_services/create-onboarding-project";
import { CreateOnboardingProjectSchema } from "./_services/create-onboarding-project.schema";

export const onboardingRouter = router({
  createProject: protectedProcedure
    .input(CreateOnboardingProjectSchema)
    .mutation(({ input, ctx }) =>
      createOnboardingProject({
        userId: ctx.session.user.id,
        name: input.name,
        domain: input.domain,
      }),
    ),
  complete: protectedProcedure.mutation(({ ctx }) =>
    completeOnboarding({ userId: ctx.session.user.id }),
  ),
});
