"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { DashboardPanel } from "../../_components/dashboard-panel";
import { FigureUnavailable } from "../../_components/figure-unavailable";
import { ShareBar, ShareBarSkeleton } from "../../_components/share-bar";

const ROW_LABELS = {
  gitHub: "GitHub, of paying",
  linear: "Linear, of paying",
  jira: "Jira, of paying",
  slack: "Slack, of paying",
  agentToken: "Agent token, of engaged",
} as const;

const ROW_KEYS = ["gitHub", "linear", "jira", "slack", "agentToken"] as const;

export function AdoptionCard() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getActivationOverview.queryOptions(),
  );

  return (
    <DashboardPanel title="Adoption">
      {matchQueryStatus(query, {
        Loading: (
          <>
            {ROW_KEYS.map((key) => (
              <ShareBarSkeleton key={key} label={ROW_LABELS[key]} />
            ))}
            <Skeleton className="h-5 w-full" />
          </>
        ),
        Errored: (error) => (
          <FigureUnavailable description={getErrorMessage(error)} />
        ),
        Empty: (
          <FigureUnavailable description="No usage figures were returned." />
        ),
        Success: ({ data }) => (
          <>
            {ROW_KEYS.map((key) => (
              <ShareBar
                key={key}
                label={ROW_LABELS[key]}
                count={data.adoption[key].count}
                base={data.adoption[key].base}
              />
            ))}
            <p className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Videos uploaded</span>
              <span className="font-semibold tabular-nums">
                {data.videosUploaded}
              </span>
            </p>
          </>
        ),
      })}
    </DashboardPanel>
  );
}
