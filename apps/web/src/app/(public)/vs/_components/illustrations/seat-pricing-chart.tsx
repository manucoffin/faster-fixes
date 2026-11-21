import { cn } from "@workspace/ui/lib/utils";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

import {
  type SeatPricingRow,
  SeatPricingPlot,
} from "./seat-pricing-chart.client";

export type SeatPricingTier = {
  name: string;
  seats: number;
  monthlyPrice: number;
};

export type SeatPricingChartProps = {
  competitorName: string;
  tiers: SeatPricingTier[];
  extraSeatPrice?: number;
  maxSeats?: number;
  className?: string;
};

// The open source app costs nothing to run on your own server, whatever the team size.
const SELF_HOSTED_PRICE = 0;

const HOSTED_LABEL = "FasterFixes hosted";
const SELF_HOSTED_LABEL = "Self-hosted";

// Cheapest way to seat `members` people: a tier that already includes them,
// or a smaller tier topped up with extra seats.
function getCompetitorMonthlyCost(
  tiers: SeatPricingTier[],
  members: number,
  extraSeatPrice: number | undefined,
) {
  const costs = tiers.flatMap((tier) => {
    if (tier.seats >= members) return [tier.monthlyPrice];
    if (extraSeatPrice === undefined) return [];
    return [tier.monthlyPrice + (members - tier.seats) * extraSeatPrice];
  });
  if (costs.length > 0) return Math.min(...costs);
  // Beyond the largest tier with no extra seat price: hold the largest tier's price.
  return Math.max(0, ...tiers.map((tier) => tier.monthlyPrice));
}

function getHostedMonthlyCost(members: number) {
  return members <= PLAN_LIMITS[SubscriptionPlanName.Pro].seats
    ? PLAN_PRICES[SubscriptionPlanName.Pro]
    : PLAN_PRICES[SubscriptionPlanName.Agency];
}

export function SeatPricingChart({
  competitorName,
  tiers,
  extraSeatPrice,
  maxSeats = 25,
  className,
}: SeatPricingChartProps) {
  const rows: SeatPricingRow[] = Array.from({ length: maxSeats }, (_, i) => {
    const members = i + 1;
    return {
      members,
      competitor: getCompetitorMonthlyCost(tiers, members, extraSeatPrice),
      hosted: getHostedMonthlyCost(members),
      selfHosted: SELF_HOSTED_PRICE,
    };
  });

  const highestCost = Math.max(
    ...rows.map((row) => Math.max(row.competitor, row.hosted)),
    1,
  );
  const yStep = highestCost <= 200 ? 50 : 100;
  const yMax = Math.ceil(highestCost / yStep) * yStep;
  const yTicks = Array.from({ length: yMax / yStep + 1 }, (_, i) => i * yStep);
  const xTicks = [
    ...new Set([
      1,
      ...tiers.map((tier) => tier.seats).filter((seats) => seats < maxSeats),
      maxSeats,
    ]),
  ];

  // The first and last team sizes plus every size where a price changes:
  // enough to read each step without listing all members one by one.
  const tableRows = rows.filter((row, i) => {
    const previous = rows[i - 1];
    return (
      previous === undefined ||
      i === rows.length - 1 ||
      previous.competitor !== row.competitor ||
      previous.hosted !== row.hosted ||
      previous.selfHosted !== row.selfHosted
    );
  });

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="font-mono text-xs text-muted-foreground">
        Monthly cost by team size.
      </figcaption>
      <SeatPricingPlot
        rows={rows}
        xTicks={xTicks}
        yTicks={yTicks}
        competitorLabel={competitorName}
        hostedLabel={HOSTED_LABEL}
        selfHostedLabel={SELF_HOSTED_LABEL}
        className="mt-4"
      />
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Members</th>
            <th scope="col">{competitorName}</th>
            <th scope="col">{HOSTED_LABEL}</th>
            <th scope="col">{SELF_HOSTED_LABEL}</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => (
            <tr key={row.members}>
              <th scope="row">{row.members}</th>
              <td>${row.competitor}/month</td>
              <td>${row.hosted}/month</td>
              <td>${row.selfHosted}/month</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
