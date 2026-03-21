import { projectsRouter } from "@/app/(authenticated)/(project)/_utils/trpc-router";
import { accountRouter } from "@/app/(authenticated)/account/_utils/trpc-router";
import { organizationRouter } from "@/app/(authenticated)/organization/_utils/trpc-router";
import { router } from "@/server/trpc/trpc";
import { sendFeedback } from "../_features/feedback/send-feedback.trpc.mutation";

export const authenticatedRouter = router({
  account: accountRouter,
  organization: organizationRouter,
  projects: projectsRouter,
  feedback: router({
    send: sendFeedback,
  }),
});
