"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function MrrCard() {
  const query = trpc.admin.dashboard.mrr.get.useQuery();

  return matchQueryStatus(query, {
    Loading: <MrrCardLoading />,
    Errored: <MrrCardError />,
    Success: ({ data }) => {
      const formattedTotalRevenue = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(data?.totalRevenue ?? 0);

      const formattedMrr = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(data?.mrr ?? 0);

      const formattedArr = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(data?.arr ?? 0);

      return (
        <Card>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTotalRevenue}</div>
            <p className="text-muted-foreground mb-4 text-xs">
              Revenu total généré
            </p>

            {/* Breakdown section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">MRR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formattedMrr}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">ARR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formattedArr}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  });
}

function MrrCardLoading() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex items-baseline gap-2">
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3 border-t pt-4">
          <Skeleton className="size-40" />
          <Skeleton className="size-40" />
        </div>
      </CardContent>
    </Card>
  );
}

function MrrCardError() {
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
