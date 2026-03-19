import { router } from "@/server/trpc/trpc";
import { deleteUser } from "../[id]/_features/account/delete-user/delete-user.trpc.mutation";
import { impersonateUser } from "../[id]/_features/account/impersonate-user/impersonate-user.trpc.mutation";
import { requestPasswordReset } from "../[id]/_features/account/request-password-reset/request-password-reset.trpc.mutation";
import { revokeUserSessions } from "../[id]/_features/account/revoke-user-sessions/revoke-user-sessions.trpc.mutation";
import { getUserOrganizations } from "../[id]/_features/organization-select/get-user-organizations.trpc.query";
import { createSubscription } from "../[id]/_features/subscription/create-subscription.trpc.mutation";
import { getSubscription } from "../[id]/_features/subscription/get-subscription.trpc.query";
import { updateSubscription } from "../[id]/_features/subscription/update-subscription.trpc.mutation";
import { getUserEmail } from "../[id]/_features/user-information/email/get-user-email.trpc.query";
import { toggleEmailVerified } from "../[id]/_features/user-information/email/toggle-email-verified.trpc.mutation";
import { createUser } from "../_features/create-user/create-user.trpc.mutation";
import { getAllUsersForExport } from "../_features/users-table/get-all-users-for-export";
import { getPaginatedUsers } from "../_features/users-table/get-paginated-users";

export const usersRouter = router({
  list: getPaginatedUsers,
  export: getAllUsersForExport,
  create: createUser,
  delete: deleteUser,
  impersonate: impersonateUser,
  organisations: router({
    list: getUserOrganizations,
  }),
  sessions: router({
    revoke: revokeUserSessions,
  }),
  password: router({
    requestReset: requestPasswordReset,
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
