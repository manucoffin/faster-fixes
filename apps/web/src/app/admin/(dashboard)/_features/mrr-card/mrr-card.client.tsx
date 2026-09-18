"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function MrrCard() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getMrr.queryOptions());

  return matchQueryStatus(query, {
    Loading: <MrrCardLoading />,
    Errored: <MrrCardError />,
    Success: ({ data }) => {
      const formatEur = (value: number) =>
        new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(value);

      const formattedGrossRevenue = formatEur(data?.grossRevenue ?? 0);
      const formattedNetRevenue = formatEur(data?.netRevenue ?? 0);
      const formattedMrr = formatEur(data?.mrr ?? 0);
      const formattedArr = formatEur(data?.arr ?? 0);
      const formattedLtv = data?.ltv == null ? "—" : formatEur(data.ltv);

      return (
        <Card>
          <CardContent>
            <div className="text-2xl font-bold">{formattedGrossRevenue}</div>
            <p className="text-xs text-muted-foreground">Gross revenue</p>
            <p className="mb-4 text-xs text-muted-foreground">
              {formattedNetRevenue} net
            </p>

            {/* Breakdown section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">MRR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formattedMrr}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ARR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formattedArr}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">LTV</span>
                  <span className="text-xs text-muted-foreground">
                    {formattedLtv}
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

function MrrCardLoading() {
  return (
    <Card>
      <CardContent>
        <Skeleton className="h-8 w-24" />
        <p className="text-xs text-muted-foreground">Gross revenue</p>
        <Skeleton className="mt-1 mb-4 h-4 w-20" />

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">MRR</span>
            <Skeleton className="h-5 w-16" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ARR</span>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">LTV</span>
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MrrCardError() {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </CardContent>
    </Card>
  );
}
