"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function ActiveSubscriptionsCard() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.subscriptions.get.queryOptions());

  return matchQueryStatus(query, {
    Loading: <ActiveSubscriptionsCardLoading />,
    Errored: <ActiveSubscriptionsCardError />,
    Success: ({ data }) => (
      <Card>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{data?.totalCount}</div>
            <span className="text-muted-foreground text-xs">
              ({data?.conversionRate}% des utilisateurs)
            </span>
          </div>
          <p className="text-muted-foreground mb-4 text-xs">
            Abonnements Actifs
          </p>

          {/* Breakdown section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Kylo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{data?.kyloCount}</span>
                <span className="text-muted-foreground text-xs">
                  ({data?.kyloPercentage}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Balto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {data?.baltoCount}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({data?.baltoPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  });
}

function ActiveSubscriptionsCardLoading() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex items-baseline gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3 border-t pt-4">
          <Skeleton className="size-40" />
          <Skeleton className="size-40" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveSubscriptionsCardError() {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <p className="text-destructive text-sm">
          Erreur lors du chargement des statistiques
        </p>
      </CardContent>
    </Card>
  );
}
