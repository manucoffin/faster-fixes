import { router } from "@/server/trpc/trpc";
import { getActiveSubscriptions } from "../_features/active-subscriptions-card/get-active-subscriptions.trpc.query";
import { getMrr } from "../_features/mrr-card/get-mrr.trpc.query";
import { getMonthlyStats } from "../_features/subscriptions-chart/get-monthly-stats.trpc.query";
import { getUsersOverview } from "../_features/users-overview-card/get-users-overview.trpc.query";

export const dashboardRouter = router({
  users: router({
    get: getUsersOverview,
  }),
  subscriptions: router({
    get: getActiveSubscriptions,
  }),
  mrr: router({
    get: getMrr,
  }),
  stats: router({
    get: getMonthlyStats,
  }),
});
