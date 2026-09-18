import { stripeApi } from "@/server/stripe";
import { prisma } from "@workspace/db";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import type { GetMonthlyStatsInput } from "./get-monthly-stats.schema";

/**
 * Sum gross charge volume (cents) for a month. Auto-pagination walks every
 * charge in the window — the previous `limit: 100` silently truncated months
 * with more than 100 charges, undercounting revenue.
 */
async function sumMonthlyGrossRevenueCents(
  start: Date,
  end: Date,
): Promise<number> {
  let total = 0;
  for await (const txn of stripeApi.balanceTransactions.list({
    type: "charge",
    created: {
      gte: Math.floor(start.getTime() / 1000),
      lte: Math.floor(end.getTime() / 1000),
    },
    limit: 100,
  })) {
    total += txn.amount;
  }
  return total;
}

export async function getMonthlyStats({ from, to }: GetMonthlyStatsInput) {
  const today = new Date();

  // Determine the date range
  let startDate: Date;
  let endDate: Date;

  if (from && to) {
    startDate = startOfMonth(new Date(from));
    endDate = endOfMonth(new Date(to));
  } else {
    // Default to last 6 months
    startDate = startOfMonth(subMonths(today, 5));
    endDate = endOfMonth(today);
  }

  // Generate array of month ranges between start and end dates
  const monthRanges: Array<{
    start: Date;
    end: Date;
    label: string;
    month: string;
  }> = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    monthRanges.push({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
      label: format(currentDate, "MMM yyyy"),
      month: format(currentDate, "MMM"),
    });
    currentDate = subMonths(currentDate, -1); // Move to next month
  }

  // Fetch data for each month in parallel
  const monthlyData = await Promise.all(
    monthRanges.map(async (range) => {
      const createdInRange = {
        gte: range.start,
        lte: range.end,
      };

      const [userCount, subscriptionCount, grossRevenueCents] =
        await Promise.all([
          prisma.user.count({ where: { createdAt: createdInRange } }),
          // "New subscriptions" = created that month. periodStart advances on
          // every renewal, so filtering by it counted renewals as new signups.
          prisma.subscription.count({ where: { createdAt: createdInRange } }),
          sumMonthlyGrossRevenueCents(range.start, range.end),
        ]);

      return {
        month: range.month,
        fullLabel: range.label,
        users: userCount,
        subscriptions: subscriptionCount,
        revenue: grossRevenueCents / 100,
      };
    }),
  );

  return monthlyData;
}

export type GetMonthlyStatsOutput = Awaited<ReturnType<typeof getMonthlyStats>>;
