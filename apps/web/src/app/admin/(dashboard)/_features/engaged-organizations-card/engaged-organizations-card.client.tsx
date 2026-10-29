"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { FigureUnavailable } from "../../_components/figure-unavailable";
import {
  HeadlineFigure,
  HeadlineFigureFrame,
  HeadlineFigureSkeleton,
} from "@/app/admin/_components/headline-figure";

const LABEL = "Engaged organizations";

export function EngagedOrganizationsCard() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getUsageOverview.queryOptions());

  return matchQueryStatus(query, {
    Loading: <HeadlineFigureSkeleton label={LABEL} />,
    Errored: (error) => (
      <HeadlineFigureFrame label={LABEL}>
        <FigureUnavailable description={getErrorMessage(error)} />
      </HeadlineFigureFrame>
    ),
    Empty: (
      <HeadlineFigureFrame label={LABEL}>
        <FigureUnavailable description="No usage figures were returned." />
      </HeadlineFigureFrame>
    ),
    Success: ({ data }) => {
      const { current, previous } = data.engagedOrganizations;
      const delta = current - previous;

      return (
        <HeadlineFigure
          label={LABEL}
          value={String(current)}
          delta={{
            value: delta,
            label: `${delta > 0 ? "+" : ""}${delta}`,
            comparison: "vs 30 days ago",
          }}
          hint="Received Feedback in the last 30 days"
        />
      );
    },
  });
}
