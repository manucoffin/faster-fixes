import { stripeApi } from "@/server/stripe";
import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { prisma } from "@workspace/db";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { z } from "zod";

const getMonthlyStatsInputSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export const getMonthlyStats = adminProcedure
  .input(getMonthlyStatsInputSchema)
  .query(async ({ input }) => {
    try {
      const today = new Date();

      // Determine the date range
      let startDate: Date;
      let endDate: Date;

      if (input.from && input.to) {
        startDate = startOfMonth(new Date(input.from));
        endDate = endOfMonth(new Date(input.to));
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
          const [userCount, subscriptionCount, balanceTransactions] =
            await Promise.all([
              prisma.user.count({
                where: {
                  createdAt: {
                    gte: range.start,
                    lte: range.end,
                  },
                },
              }),
              prisma.subscription.count({
                where: {
                  periodStart: {
                    gte: range.start,
                    lte: range.end,
                  },
                },
              }),
              stripeApi.balanceTransactions.list({
                type: "charge",
                created: {
                  gte: Math.floor(range.start.getTime() / 1000),
                  lte: Math.floor(range.end.getTime() / 1000),
                },
                limit: 100,
              }),
            ]);

          // Sum actual revenue received (net amount after Stripe fees)
          const revenue = balanceTransactions.data.reduce(
            (sum, txn) => sum + txn.net,
            0
          );

          return {
            month: range.month,
            fullLabel: range.label,
            users: userCount,
            subscriptions: subscriptionCount,
            revenue: revenue / 100, // Convert cents to dollars
          };
        })
      );

      return monthlyData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get monthly stats",
        cause: error,
      });
    }
  });

export type GetMonthlyStatsOutput = inferProcedureOutput<
  typeof getMonthlyStats
>;
