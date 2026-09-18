import { adminProcedure, router } from "@/server/trpc/trpc";
import { getActiveSubscriptions } from "./_services/get-active-subscriptions";
import { getFeedbackOverview } from "./_services/get-feedback-overview";
import { getMonthlyStats } from "./_services/get-monthly-stats";
import { GetMonthlyStatsSchema } from "./_services/get-monthly-stats.schema";
import { getMrr } from "./_services/get-mrr";
import { getUsersOverview } from "./_services/get-users-overview";

// The admin role check stays on `adminProcedure`: it is answerable from the
// context alone, so no dashboard service repeats it.
export const dashboardRouter = router({
  getUsersOverview: adminProcedure.query(() => getUsersOverview()),
  getActiveSubscriptions: adminProcedure.query(() => getActiveSubscriptions()),
  getMrr: adminProcedure.query(() => getMrr()),
  getFeedbackOverview: adminProcedure.query(() => getFeedbackOverview()),
  getMonthlyStats: adminProcedure
    .input(GetMonthlyStatsSchema)
    .query(({ input }) => getMonthlyStats({ from: input.from, to: input.to })),
});
