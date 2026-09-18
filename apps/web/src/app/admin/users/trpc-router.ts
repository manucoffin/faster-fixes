import { adminProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createSubscription } from "./[id]/_features/subscription/create-subscription.trpc.mutation";
import { getSubscription } from "./[id]/_features/subscription/get-subscription.trpc.query";
import { updateSubscription } from "./[id]/_features/subscription/update-subscription.trpc.mutation";
import { getUserOrganizations } from "./[id]/_features/organization-select/get-user-organizations.trpc.query";
import { getUserEmail } from "./[id]/_features/user-information/email/get-user-email.trpc.query";
import { toggleEmailVerified } from "./[id]/_features/user-information/email/toggle-email-verified.trpc.mutation";
import { getAllUsersForExport } from "./_features/users-table/get-all-users-for-export";
import { getPaginatedUsers } from "./_features/users-table/get-paginated-users";
import { createUser } from "./_services/create-user";
import { CreateUserSchema } from "./_services/create-user.schema";
import { deleteUser } from "./_services/delete-user";
import { DeleteUserSchema } from "./_services/delete-user.schema";
import { impersonateUser } from "./_services/impersonate-user";
import { ImpersonateUserSchema } from "./_services/impersonate-user.schema";
import { requestPasswordReset } from "./_services/request-password-reset";
import { RequestPasswordResetSchema } from "./_services/request-password-reset.schema";
import { revokeUserSessions } from "./_services/revoke-user-sessions";
import { RevokeUserSessionsSchema } from "./_services/revoke-user-sessions.schema";

// The admin role check stays on `adminProcedure`: it is answerable from the
// context alone, so no service of this scope repeats it. The operations still
// imported from `_features/` are migrated by issue #67.
export const usersRouter = router({
  list: getPaginatedUsers,
  export: getAllUsersForExport,
  create: adminProcedure
    .input(CreateUserSchema)
    .mutation(({ input }) => createUser(input)),
  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(({ input }) => deleteUser({ userId: input.userId })),
  impersonate: adminProcedure
    .input(ImpersonateUserSchema)
    .mutation(async ({ input }) =>
      impersonateUser({ userId: input.userId, headers: await headers() }),
    ),
  organizations: router({
    list: getUserOrganizations,
  }),
  sessions: router({
    revoke: adminProcedure
      .input(RevokeUserSessionsSchema)
      .mutation(async ({ input }) =>
        revokeUserSessions({ userId: input.userId, headers: await headers() }),
      ),
  }),
  password: router({
    requestReset: adminProcedure
      .input(RequestPasswordResetSchema)
      .mutation(async ({ input }) =>
        requestPasswordReset({
          userId: input.userId,
          headers: await headers(),
        }),
      ),
  }),
  email: router({
    get: getUserEmail,
    toggleVerified: toggleEmailVerified,
  }),
  subscription: router({
    get: getSubscription,
    create: createSubscription,
    update: updateSubscription,
  }),
});
