import { getActiveSubscription } from "@/app/_domains/subscription/_services/get-active-subscription";
import { deleteAccount } from "@/app/(authenticated)/account/settings/_features/account-deletion/delete-account.trpc.mutation";
import { getCurrentEmail } from "@/app/(authenticated)/account/settings/_features/email/get-current-email.trpc.query";
import { changePassword } from "@/app/(authenticated)/account/settings/_features/password/change-password.trpc.mutation";
import { getProfile } from "@/app/(authenticated)/account/settings/_features/profile/get-profile.trpc.query";
import { updateAvatar } from "@/app/(authenticated)/account/settings/_features/profile/update-avatar.trpc.mutation";
import { updateProfile } from "@/app/(authenticated)/account/settings/_features/profile/update-profile.trpc.mutation";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createBillingPortal } from "./billing/_services/create-billing-portal";
import { getSubscriptionStatus } from "./billing/_services/get-subscription-status";
import { listPastInvoices } from "./billing/_services/list-past-invoices";

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
      // The active Subscription is read from the Subscription domain: the
      // billing segment displays it, it does not own it.
      get: protectedProcedure.query(async () =>
        getActiveSubscription({ headers: await headers() }),
      ),
      getStatus: protectedProcedure.query(async () =>
        getSubscriptionStatus({ headers: await headers() }),
      ),
    }),
    invoices: router({
      list: protectedProcedure.query(async () =>
        listPastInvoices({ headers: await headers() }),
      ),
    }),
    portal: router({
      create: protectedProcedure.mutation(async () =>
        createBillingPortal({ headers: await headers() }),
      ),
    }),
  }),
});
