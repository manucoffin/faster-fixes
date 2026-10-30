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

const LABEL = "Collected in the last 30 days";

const formatEur = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value,
  );

const formatSignedEur = (value: number) =>
  `${value > 0 ? "+" : ""}${formatEur(value)}`;

export function CollectedRevenueCard() {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.dashboard.getCollectedRevenue.queryOptions(),
  );

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
      const delta = data.current - data.previous;

      return (
        <HeadlineFigure
          label={LABEL}
          value={formatEur(data.current)}
          delta={{
            value: delta,
            label: formatSignedEur(delta),
            comparison: "vs previous 30 days",
          }}
          hint="Net of refunds and fees, excluding VAT"
        >
          {data.nonEurTransactionCount > 0 && (
            <p className="text-xs text-destructive">
              {data.nonEurTransactionCount}{" "}
              {data.nonEurTransactionCount === 1
                ? "transaction"
                : "transactions"}{" "}
              in a currency other than EUR, not counted
            </p>
          )}
        </HeadlineFigure>
      );
    },
  });
}
