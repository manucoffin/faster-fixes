"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function UsersOverviewCard() {
  const query = trpc.admin.dashboard.users.get.useQuery();

  return matchQueryStatus(query, {
    Loading: <UsersOverviewCardLoading />,
    Errored: <UsersOverviewCardError />,
    Success: ({ data }) => (
      <Card>
        <CardContent>
          <div className="text-2xl font-bold">{data?.totalCount}</div>
          <p className="text-muted-foreground mb-4 text-xs">
            Total utilisateurs
          </p>

          {/* New users this month section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Nouveaux ce mois
              </span>
              <span className="text-sm font-semibold">
                {data?.newUsersThisMonth}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  });
}

function UsersOverviewCardLoading() {
  return (
    <Card>
      <CardContent>
        <div className="mb-1">
          <Skeleton className="h-8 w-24" />
        </div>
        <p className="text-muted-foreground mb-4 text-xs">
          Total utilisateurs
        </p>

        {/* New users section skeleton */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Nouveaux ce mois</span>
            <Skeleton className="h-5 w-8" />
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
        <p className="text-destructive text-sm">
          Erreur lors du chargement des statistiques
        </p>
      </CardContent>
    </Card>
  );
}
