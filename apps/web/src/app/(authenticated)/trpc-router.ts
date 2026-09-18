import { projectsRouter } from "@/app/(authenticated)/(project)/_utils/trpc-router";
import { accountRouter } from "@/app/(authenticated)/account/trpc-router";
import { integrationsRouter } from "@/app/(authenticated)/integrations/_utils/trpc-router";
import { organizationRouter } from "@/app/(authenticated)/organization/_utils/trpc-router";
import { enforceLimit } from "@/server/trpc/middlewares/enforce-limit";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { createProject } from "./_services/create-project";
import { CreateProjectSchema } from "./_services/create-project.schema";
import { sendFeedback } from "./_services/send-feedback";
import { SendFeedbackSchema } from "./_services/send-feedback.schema";

export const authenticatedRouter = router({
  account: accountRouter,
  organization: organizationRouter,
  integrations: integrationsRouter,
  projects: projectsRouter,

  // The two operations the authenticated shell owns itself: the sidebar's
  // create-project dialog and the header's feedback popover.
  createProject: planAwareProcedure
    .use(enforceLimit("projects"))
    .input(CreateProjectSchema)
    .mutation(({ input, ctx }) =>
      createProject({
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
        name: input.name,
        domain: input.domain,
      }),
    ),
  sendFeedback: protectedProcedure
    .input(SendFeedbackSchema)
    .mutation(({ input, ctx }) =>
      sendFeedback({
        message: input.message,
        senderName: ctx.session.user.name,
        senderEmail: ctx.session.user.email,
      }),
    ),
});
