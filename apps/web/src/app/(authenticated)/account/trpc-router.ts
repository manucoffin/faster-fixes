import { getOrganizationSubscription } from "@/app/_domains/subscription/_services/get-organization-subscription";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createBillingPortal } from "./billing/_services/create-billing-portal";
import { getSubscriptionStatus } from "./billing/_services/get-subscription-status";
import { listPastInvoices } from "./billing/_services/list-past-invoices";
import { deleteAccount } from "./settings/_services/delete-account";
import { DeleteAccountSchema } from "./settings/_services/delete-account.schema";
import { getCurrentEmail } from "./settings/_services/get-current-email";
import { getProfile } from "./settings/_services/get-profile";
import { updateAvatar } from "./settings/_services/update-avatar";
import { updatePassword } from "./settings/_services/update-password";
import { UpdatePasswordSchema } from "./settings/_services/update-password.schema";
import { updateProfile } from "./settings/_services/update-profile";
import { UpdateProfileSchema } from "./settings/_services/update-profile.schema";

export const accountRouter = router({
  delete: protectedProcedure
    .input(DeleteAccountSchema)
    .mutation(async ({ input }) =>
      deleteAccount({
        password: input.password,
        headers: await headers(),
      }),
    ),
  profile: router({
    get: protectedProcedure.query(({ ctx }) =>
      getProfile({ userId: ctx.session.user.id }),
    ),
    update: protectedProcedure
      .input(UpdateProfileSchema)
      .mutation(({ input, ctx }) =>
        updateProfile({
          userId: ctx.session.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      ),
    updateAvatar: protectedProcedure.mutation(({ ctx }) =>
      updateAvatar({ userId: ctx.session.user.id }),
    ),
  }),
  email: router({
    get: protectedProcedure.query(({ ctx }) =>
      getCurrentEmail({ userId: ctx.session.user.id }),
    ),
  }),
  password: router({
    update: protectedProcedure
      .input(UpdatePasswordSchema)
      .mutation(async ({ input }) =>
        updatePassword({
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          headers: await headers(),
        }),
      ),
  }),
  billing: router({
    subscription: router({
      // The Organization's Subscription is read from the Subscription domain:
      // the billing segment displays it, it does not own it.
      get: protectedProcedure.query(async () =>
        getOrganizationSubscription({ headers: await headers() }),
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
