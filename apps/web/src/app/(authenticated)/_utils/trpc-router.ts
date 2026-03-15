import { router } from "@/server/trpc/trpc";
import { accountRouter } from "../mon-compte/_utils/trpc-router";
import { organisationRouter } from "../organisation/_utils/trpc-router";

export const authenticatedRouter = router({
  account: accountRouter,
  organisation: organisationRouter,
});
