import { router } from "@/server/trpc/trpc";
import { deleteAccount } from "../parametres/_features/account-deletion/delete-account.trpc.mutation";
import { getCurrentEmail } from "../parametres/_features/email/get-current-email.trpc.query";
import { changePassword } from "../parametres/_features/password/change-password.trpc.mutation";
import { getProfile } from "../parametres/_features/profile/get-profile.trpc.query";
import { updateProfile } from "../parametres/_features/profile/update-profile.trpc.mutation";
import { getOrganizationDetails } from "../organisation/_features/general/get-organization-details.trpc.query";
import { getActiveSubscription } from "../facturation/_features/current-plan/get-active-subscription.trpc.query";
import { createBillingPortal } from "../facturation/_features/manage-subscription/create-billing-portal.trpc.mutation";
import { getPastInvoices } from "../facturation/_features/past-invoices/get-past-invoices.trpc.query";
import { getSubscriptionStatus } from "../facturation/_features/subscription-status/get-subscription-status.trpc.query";

export const accountRouter = router({
  delete: deleteAccount,
  profile: router({
    get: getProfile,
    update: updateProfile,
  }),
  email: router({
    get: getCurrentEmail,
  }),
  password: router({
    change: changePassword,
  }),
  organisation: router({
    get: getOrganizationDetails,
  }),
  billing: router({
    subscription: router({
      get: getActiveSubscription,
      status: getSubscriptionStatus,
    }),
    invoices: router({
      list: getPastInvoices,
    }),
    portal: router({
      create: createBillingPortal,
    }),
  }),
});
