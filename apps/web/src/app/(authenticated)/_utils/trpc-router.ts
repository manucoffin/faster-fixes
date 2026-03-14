import { router } from "@/server/trpc/trpc";
import { getActiveSubscription } from "../mon-compte/facturation/_features/current-plan/get-active-subscription.trpc.query";
import { createBillingPortal } from "../mon-compte/facturation/_features/manage-subscription/create-billing-portal.trpc.mutation";
import { getPastInvoices } from "../mon-compte/facturation/_features/past-invoices/get-past-invoices.trpc.query";
import { getSubscriptionStatus } from "../mon-compte/facturation/_features/subscription-status/get-subscription-status.trpc.query";
import { organisationRouter } from "../mon-compte/organisation/_utils/trpc-router";
import { settingsRouter } from "../mon-compte/parametres/_utils/trpc-router";

export const authenticatedRouter = router({
  account: {
    settings: settingsRouter,
    organisation: organisationRouter,
  },
  billing: {
    getActiveSubscription: getActiveSubscription,
    getPastInvoices: getPastInvoices,
    getSubscriptionStatus: getSubscriptionStatus,
    createBillingPortal: createBillingPortal,
  },
});
