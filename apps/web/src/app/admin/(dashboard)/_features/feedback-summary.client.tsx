"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { FigureUnavailable } from "../_components/figure-unavailable";
import { getDeltaTone } from "@/app/admin/_helpers/get-delta-tone";

export function FeedbackSummary() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getFeedbackOverview.queryOptions(),
  );

  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-4 py-3 text-sm">
      <h3 className="font-medium">Feedback</h3>
      {matchQueryStatus(query, {
        Loading: <Skeleton className="h-5 w-96" />,
        Errored: (error) => (
          <FigureUnavailable description={getErrorMessage(error)} />
        ),
        Empty: (
          <FigureUnavailable description="No Feedback figures were returned." />
        ),
        Success: ({ data }) => {
          const { current, previous } = data.received;
          const delta = current - previous;

          return (
            <>
              <span>
                <span className="font-semibold tabular-nums">{current}</span>{" "}
                <span className="text-muted-foreground">
                  received in the last 30 days
                </span>{" "}
                <span
                  className={cn("text-xs font-medium", getDeltaTone(delta))}
                  title="vs previous 30 days"
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              </span>
              <Count value={data.pending} label="pending" />
              <Count value={data.resolved} label="resolved" />
              <Count value={data.archived} label="archived" />
            </>
          );
        },
      })}
    </section>
  );
}

type CountProps = {
  value: number;
  label: string;
};

function Count({ value, label }: CountProps) {
  return (
    <span>
      <span className="font-semibold tabular-nums">{value}</span>{" "}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
