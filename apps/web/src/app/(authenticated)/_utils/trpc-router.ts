import { router } from "@/server/trpc/trpc";
import { createBillingPortal } from "../_features/sidebar/manage-subscription/create-billing-portal.trpc.mutation";
import { getActiveSubscription } from "../mon-compte/facturation/_features/current-plan/get-active-subscription.trpc.query";
import { getPastInvoices } from "../mon-compte/facturation/_features/past-invoices/get-past-invoices.trpc.query";
import { getSubscriptionStatus } from "../mon-compte/facturation/_features/subscription-status/get-subscription-status.trpc.query";
import { settingsRouter } from "../mon-compte/parametres/_utils/trpc-router";

export const authenticatedRouter = router({
  createBillingPortal: createBillingPortal,
  account: {
    settings: settingsRouter,
  },
  billing: {
    getActiveSubscription: getActiveSubscription,
    getPastInvoices: getPastInvoices,
    getSubscriptionStatus: getSubscriptionStatus,
    createBillingPortal: createBillingPortal,
  },
});
