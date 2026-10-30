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

const LABEL = "Paying organizations";

export function PayingOrganizationsCard() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.dashboard.getBillingMetrics.queryOptions());

  return matchQueryStatus(query, {
    Loading: <HeadlineFigureSkeleton label={LABEL} />,
    Errored: (error) => (
      <HeadlineFigureFrame label={LABEL}>
        <FigureUnavailable description={getErrorMessage(error)} />
      </HeadlineFigureFrame>
    ),
    Empty: (
      <HeadlineFigureFrame label={LABEL}>
        <FigureUnavailable description="No billing figures were returned." />
      </HeadlineFigureFrame>
    ),
    Success: ({ data }) => {
      const { total, pro, agency } = data.payingOrganizations;
      const delta = total - data.previous.payingOrganizationCount;

      return (
        <HeadlineFigure
          label={LABEL}
          value={String(total)}
          delta={{
            value: delta,
            label: `${delta > 0 ? "+" : ""}${delta}`,
            comparison: "vs 30 days ago",
          }}
          hint={`${pro} Pro, ${agency} Agency`}
        />
      );
    },
  });
}
