"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Building2, HeartHandshake } from "lucide-react";

export function UsersOverviewCard() {
  const query = trpc.admin.dashboard.getUsersOverview.useQuery();

  return matchQueryStatus(query, {
    Loading: <UsersOverviewCardLoading />,
    Errored: <UsersOverviewCardError />,
    Success: ({ data }) => (
      <Card>
        <CardContent>
          <div className="text-2xl font-bold">{data?.totalCount}</div>
          <p className="text-muted-foreground mb-4 text-xs">
            Utilisateurs inscrits
          </p>

          {/* Breakdown section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-xs">
                  Pet Parents
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {data?.petParentCount}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({data?.petParentPercentage}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-xs">
                  Professionnels
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {data?.professionalCount}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({data?.professionalPercentage}%)
                </span>
              </div>
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
          Utilisateurs inscrits
        </p>

        {/* Breakdown section skeleton */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-xs">Pet Parents</span>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-xs">
                Professionnels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-12" />
            </div>
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
