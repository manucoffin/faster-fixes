"use client";

import { PeriodSelector } from "@/app/_components/dashboard/period-selector.client";
import { periodSelectorParsers } from "@/app/_components/dashboard/search-params";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ChartContainer, ChartTooltip } from "@workspace/ui/components/chart";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useQueryStates } from "nuqs";
import { Area, Bar, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { GetMonthlyStatsOutput } from "../../_services/get-monthly-stats";

type MonthData = GetMonthlyStatsOutput[number];

/** The tooltip label of a series; revenue is the remaining series. */
function getSeriesLabel(name: string | number | undefined): string {
  if (name === "users") return "Users:";
  if (name === "subscriptions") return "Subscriptions:";
  return "Revenue:";
}

export function SubscriptionsChart() {
  const trpc = useTRPC();
  const [period] = useQueryStates(periodSelectorParsers);

  const getMonthlyStatsQuery = useQuery(
    trpc.admin.dashboard.getMonthlyStats.queryOptions({
      from: period.from ? new Date(period.from) : undefined,
      to: period.to ? new Date(period.to) : undefined,
    }),
  );

  return matchQueryStatus(getMonthlyStatsQuery, {
    Loading: <SubscriptionsChartLoading />,
    Errored: <SubscriptionsChartError />,
    Success: ({ data }) => (
      <Card className="lg:col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscriptions and users by month</CardTitle>
            <PeriodSelector />
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[300px] w-full"
            config={{
              users: {
                label: "New users",
                color: "var(--chart-5)",
              },
              subscriptions: {
                label: "New subscriptions",
                color: "var(--chart-1)",
              },
              revenue: {
                label: "Revenue",
                color: "var(--chart-2)",
              },
            }}
          >
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                width={30}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                label={{
                  value: "Users",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={30}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                label={{
                  value: "Subscriptions",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <YAxis
                yAxisId="far-right"
                orientation="right"
                width={50}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                label={{
                  value: "Revenue (€)",
                  angle: 90,
                  position: "right",
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="users"
                name="users"
                fill="var(--color-users)"
                radius={[4, 4, 0, 0]}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="subscriptions"
                name="subscriptions"
                fill="var(--color-subscriptions)"
                stroke="var(--color-subscriptions)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Line
                yAxisId="far-right"
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />

              <ChartTooltip
                content={({ active, payload }) => {
                  const firstEntry = payload?.[0];
                  if (!active || !firstEntry) return null;

                  const data = firstEntry.payload as MonthData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <div className="font-medium">{data.fullLabel}</div>
                      <div className="space-y-1 text-sm">
                        {payload.map((entry, index) => (
                          <div key={index} className="flex gap-2">
                            <span
                              className="mt-1 h-3 w-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
                              {getSeriesLabel(entry.name)}
                            </span>
                            <span className="font-medium">
                              {entry.name === "revenue"
                                ? new Intl.NumberFormat("fr-FR", {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(entry.value as number)
                                : entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    ),
  });
}

function SubscriptionsChartLoading() {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function SubscriptionsChartError() {
  return (
    <Card className="border-destructive/50 lg:col-span-4">
      <CardHeader>
        <CardTitle>Subscriptions and users by month</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </CardContent>
    </Card>
  );
}
