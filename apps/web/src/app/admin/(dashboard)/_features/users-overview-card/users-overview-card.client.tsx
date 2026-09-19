"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

export function UsersOverviewCard() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getUsersOverview.queryOptions());

  return matchQueryStatus(query, {
    Loading: <UsersOverviewCardLoading />,
    Errored: <UsersOverviewCardError />,
    Success: ({ data }) => {
      const growth = data?.monthOverMonthGrowth ?? null;
      const formattedGrowth =
        growth == null ? null : `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;

      return (
        <Card>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCount}</div>
            <p className="mb-4 text-xs text-muted-foreground">Total users</p>

            {/* New users this month section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  New this month
                </span>
                <span className="text-sm font-semibold">
                  {data?.newUsersThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    growth == null && "text-muted-foreground",
                    growth != null && growth > 0 && "text-success",
                    growth != null && growth < 0 && "text-destructive",
                    growth === 0 && "text-muted-foreground",
                  )}
                >
                  {formattedGrowth ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  });
}

function UsersOverviewCardLoading() {
  return (
    <Card>
      <CardContent>
        <div className="mb-1">
          <Skeleton className="h-8 w-24" />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Total users</p>

        {/* New users section skeleton */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              New this month
            </span>
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">vs last month</span>
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsersOverviewCardError() {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </CardContent>
    </Card>
  );
}
