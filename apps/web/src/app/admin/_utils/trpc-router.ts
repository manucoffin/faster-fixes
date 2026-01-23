import { router } from "@/server/trpc/trpc";
import { getActiveSubscriptions } from "../(dashboard)/_features/active-subscriptions-card/get-active-subscriptions.trpc.query";
import { getMrr } from "../(dashboard)/_features/mrr-card/get-mrr.trpc.query";
import { getMonthlyStats } from "../(dashboard)/_features/subscriptions-chart/get-monthly-stats.trpc.query";
import { getUsersOverview } from "../(dashboard)/_features/users-overview-card/get-users-overview.trpc.query";
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
  },
});
