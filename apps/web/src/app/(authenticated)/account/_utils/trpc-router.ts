import { getActiveSubscription } from "@/app/(authenticated)/account/billing/_features/current-plan/get-active-subscription.trpc.query";
import { createBillingPortal } from "@/app/(authenticated)/account/billing/_features/manage-subscription/create-billing-portal.trpc.mutation";
import { getPastInvoices } from "@/app/(authenticated)/account/billing/_features/past-invoices/get-past-invoices.trpc.query";
import { getSubscriptionStatus } from "@/app/(authenticated)/account/billing/_features/subscription-status/get-subscription-status.trpc.query";
import { deleteAccount } from "@/app/(authenticated)/account/settings/_features/account-deletion/delete-account.trpc.mutation";
import { getCurrentEmail } from "@/app/(authenticated)/account/settings/_features/email/get-current-email.trpc.query";
import { changePassword } from "@/app/(authenticated)/account/settings/_features/password/change-password.trpc.mutation";
import { getProfile } from "@/app/(authenticated)/account/settings/_features/profile/get-profile.trpc.query";
import { updateAvatar } from "@/app/(authenticated)/account/settings/_features/profile/update-avatar.trpc.mutation";
import { updateProfile } from "@/app/(authenticated)/account/settings/_features/profile/update-profile.trpc.mutation";
import { router } from "@/server/trpc/trpc";

export const accountRouter = router({
  delete: deleteAccount,
  profile: router({
    get: getProfile,
    update: updateProfile,
    updateAvatar: updateAvatar,
  }),
  email: router({
    get: getCurrentEmail,
  }),
  password: router({
    change: changePassword,
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
