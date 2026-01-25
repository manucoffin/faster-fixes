import { router } from "@/server/trpc/trpc";
import { getActiveSubscriptions } from "../(dashboard)/_features/active-subscriptions-card/get-active-subscriptions.trpc.query";
import { getMrr } from "../(dashboard)/_features/mrr-card/get-mrr.trpc.query";
import { getMonthlyStats } from "../(dashboard)/_features/subscriptions-chart/get-monthly-stats.trpc.query";
import { getUsersOverview } from "../(dashboard)/_features/users-overview-card/get-users-overview.trpc.query";
import { deleteUser } from "../utilisateurs/[id]/_features/account/delete-user/delete-user.trpc.mutation";
import { impersonateUser } from "../utilisateurs/[id]/_features/account/impersonate-user/impersonate-user.trpc.mutation";
import { requestPasswordReset } from "../utilisateurs/[id]/_features/account/request-password-reset/request-password-reset.trpc.mutation";
import { revokeUserSessions } from "../utilisateurs/[id]/_features/account/revoke-user-sessions/revoke-user-sessions.trpc.mutation";
import { getUserOrganizations } from "../utilisateurs/[id]/_features/organization-select/get-user-organizations.trpc.query";
import { createSubscription } from "../utilisateurs/[id]/_features/subscription/create-subscription.trpc.mutation";
import { getSubscription } from "../utilisateurs/[id]/_features/subscription/get-subscription.trpc.query";
import { updateSubscription } from "../utilisateurs/[id]/_features/subscription/update-subscription.trpc.mutation";
import { getUserEmail } from "../utilisateurs/[id]/_features/user-information/email/get-user-email.trpc.query";
import { toggleEmailVerified } from "../utilisateurs/[id]/_features/user-information/email/toggle-email-verified.trpc.mutation";
import { getAllUsersForExport } from "../utilisateurs/_features/users-table/get-all-users-for-export";
import { getPaginatedUsers } from "../utilisateurs/_features/users-table/get-paginated-users";

export const adminRouter = router({
  dashboard: {
    getUsersOverview: getUsersOverview,
    getActiveSubscriptions: getActiveSubscriptions,
    getMrr: getMrr,
    getMonthlyStats: getMonthlyStats,
  },
  users: {
    getPaginatedUsers: getPaginatedUsers,
    getAllUsersForExport: getAllUsersForExport,
    getUserOrganizations: getUserOrganizations,

    details: {
      deleteUser: deleteUser,
      impersonateUser: impersonateUser,
      revokeUserSessions: revokeUserSessions,
      requestPasswordReset: requestPasswordReset,
      getUserEmail: getUserEmail,
      toggleEmailVerified: toggleEmailVerified,
      getSubscription: getSubscription,
      createSubscription: createSubscription,
      updateSubscription: updateSubscription,
    },
  },
});
