import { adminProcedure, router } from "@/server/trpc/trpc";
import { getActivationOverview } from "./_services/get-activation-overview";
import { getBillingMetrics } from "./_services/get-billing-metrics";
import { getFeedbackOverview } from "./_services/get-feedback-overview";
import { getMonthlyStats } from "./_services/get-monthly-stats";
import { getUsageOverview } from "./_services/get-usage-overview";

// The admin role check stays on `adminProcedure`: it is answerable from the
// context alone, so no dashboard service repeats it.
export const dashboardRouter = router({
  getUsageOverview: adminProcedure.query(() =>
    getUsageOverview({ now: new Date() }),
  ),
  getActivationOverview: adminProcedure.query(() =>
    getActivationOverview({ now: new Date() }),
  ),
  getBillingMetrics: adminProcedure.query(() =>
    getBillingMetrics({ now: new Date() }),
  ),
  getFeedbackOverview: adminProcedure.query(() =>
    getFeedbackOverview({ now: new Date() }),
  ),
  getMonthlyStats: adminProcedure.query(() =>
    getMonthlyStats({ now: new Date() }),
  ),
});
