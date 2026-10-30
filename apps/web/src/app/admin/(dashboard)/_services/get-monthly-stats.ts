import { prisma } from "@workspace/db";
import { nonInternalSignupWhere } from "@/app/_domains/organization";
import { listParisMonths } from "../_helpers/paris-months";
import { getMonthlyBillingSeries } from "./get-monthly-billing-series";

const MONTH_COUNT = 12;

// The 12-month chart: signups from the database, billing series from Stripe,
// both bucketed by Paris month.
export async function getMonthlyStats({ now }: { now: Date }) {
  const months = listParisMonths(now, MONTH_COUNT);

  const [signupCounts, billing] = await Promise.all([
    Promise.all(
      months.map((month) =>
        prisma.user.count({
          where: {
            ...nonInternalSignupWhere,
            createdAt: { gte: month.start, lt: month.end },
          },
        }),
      ),
    ),
    getMonthlyBillingSeries({ now }),
  ]);

  return {
    months: months.map((month, index) => {
      const billingMonth = billing.months.find(
        (candidate) => candidate.key === month.key,
      );
      return {
        key: month.key,
        label: month.label,
        fullLabel: month.fullLabel,
        isPartial: month.isPartial,
        signups: signupCounts[index] ?? 0,
        payingOrganizations: billingMonth?.payingOrganizations ?? 0,
        collectedNet: billingMonth?.collectedNet ?? 0,
      };
    }),
    nonEurTransactionCount: billing.nonEurTransactionCount,
  };
}

export type GetMonthlyStatsOutput = Awaited<ReturnType<typeof getMonthlyStats>>;
