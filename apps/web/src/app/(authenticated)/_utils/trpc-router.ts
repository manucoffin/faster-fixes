import { router } from "@/server/trpc/trpc";
import { createBillingPortal } from "../_features/sidebar/manage-subscription/create-billing-portal.trpc.mutation";
import { settingsRouter } from "../mon-compte/parametres/_utils/trpc-router";

export const authenticatedRouter = router({
  createBillingPortal: createBillingPortal,
  account: {
    settings: settingsRouter,
  },
});
