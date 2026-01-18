import { router } from "@/server/trpc/trpc";
import { createBillingPortal } from "../_features/sidebar/manage-subscription/create-billing-portal.trpc.mutation";

export const authenticatedRouter = router({
  createBillingPortal: createBillingPortal,
});
