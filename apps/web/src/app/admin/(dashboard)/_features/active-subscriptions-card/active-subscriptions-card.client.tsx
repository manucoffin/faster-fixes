"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function ActiveSubscriptionsCard() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getActiveSubscriptions.queryOptions(),
  );

  return matchQueryStatus(query, {
    Loading: <ActiveSubscriptionsCardLoading />,
    Errored: <ActiveSubscriptionsCardError />,
    Success: ({ data }) => {
      const formattedChurn =
        data?.churnRate == null
          ? "N/A"
          : new Intl.NumberFormat("fr-FR", {
              style: "percent",
              maximumFractionDigits: 1,
            }).format(data.churnRate);

      return (
        <Card>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{data?.totalCount}</div>
              <span className="text-xs text-muted-foreground">
                ({data?.conversionRate}% of users)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              {formattedChurn} monthly churn
            </p>

            {/* Breakdown section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {data?.proCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({data?.proPercentage}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Agency</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {data?.agencyCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({data?.agencyPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  });
}

function ActiveSubscriptionsCardLoading() {
  return (
    <Card>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <p className="text-xs text-muted-foreground">Active subscriptions</p>
        <Skeleton className="mt-1 mb-4 h-4 w-28" />

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pro</span>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Agency</span>
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveSubscriptionsCardError() {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </CardContent>
    </Card>
  );
}
