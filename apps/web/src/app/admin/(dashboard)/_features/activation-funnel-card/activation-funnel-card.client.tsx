"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { cn } from "@workspace/ui/lib/utils";
import { DashboardPanel } from "../../_components/dashboard-panel";
import { FigureRow, FigureRowSkeleton } from "../../_components/figure-row";
import { FigureUnavailable } from "../../_components/figure-unavailable";
import { ShareBar, ShareBarSkeleton } from "../../_components/share-bar";
import { getDeltaTone } from "@/app/admin/_helpers/get-delta-tone";

const SIGNUPS_LABEL = "Signups, last 30 days";

const STEP_LABELS = [
  "Created",
  "With a Project",
  "Received Feedback",
  "Paying",
];

export function ActivationFunnelCard() {
  return (
    <DashboardPanel title="Activation">
      <SignupsRow />
      <p className="border-t pt-3 text-xs text-muted-foreground">
        Organizations created in the last 90 days
      </p>
      <FunnelBars />
    </DashboardPanel>
  );
}

function SignupsRow() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getUsageOverview.queryOptions());

  return matchQueryStatus(query, {
    Loading: <FigureRowSkeleton label={SIGNUPS_LABEL} />,
    Errored: (error) => (
      <FigureUnavailable description={getErrorMessage(error)} />
    ),
    Empty: <FigureUnavailable description="No usage figures were returned." />,
    Success: ({ data }) => {
      const { current, previous } = data.signups;
      const delta = current - previous;

      return (
        <FigureRow
          label={SIGNUPS_LABEL}
          value={String(current)}
          hint={
            <span
              className={cn("font-medium", getDeltaTone(delta))}
              title="vs previous 30 days"
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          }
        />
      );
    },
  });
}

function FunnelBars() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getActivationOverview.queryOptions(),
  );

  return matchQueryStatus(query, {
    Loading: (
      <>
        {STEP_LABELS.map((label) => (
          <ShareBarSkeleton key={label} label={label} />
        ))}
      </>
    ),
    Errored: (error) => (
      <FigureUnavailable description={getErrorMessage(error)} />
    ),
    Empty: <FigureUnavailable description="No usage figures were returned." />,
    Success: ({ data }) => {
      const { created, withProject, withFeedback, paying } = data.funnel;
      const counts = [created, withProject, withFeedback, paying];

      return (
        <>
          {STEP_LABELS.map((label, index) => (
            <ShareBar
              key={label}
              label={label}
              count={counts[index] ?? 0}
              base={created}
            />
          ))}
        </>
      );
    },
  });
}
