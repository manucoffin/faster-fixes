import { router } from "@/server/trpc/trpc";
import { sendFeedback } from "../_features/feedback/send-feedback.trpc.mutation";
import { accountRouter } from "../mon-compte/_utils/trpc-router";
import { organisationRouter } from "../organisation/_utils/trpc-router";
import { projetsRouter } from "../projets/_utils/trpc-router";

export const authenticatedRouter = router({
  account: accountRouter,
  organisation: organisationRouter,
  projets: projetsRouter,
  feedback: router({
    send: sendFeedback,
  }),
});
