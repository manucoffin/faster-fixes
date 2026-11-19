import { cn } from "@workspace/ui/lib/utils";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

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

const DRAW_SECONDS = 1.2;

const styles = `
@keyframes spc-draw { to { stroke-dashoffset: 0; } }
@keyframes spc-fade { to { opacity: 1; } }
.spc-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: spc-draw ${DRAW_SECONDS}s ease-out forwards; }
.spc-fade { opacity: 0; animation: spc-fade 0.4s ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .spc-line { animation: none; stroke-dashoffset: 0; }
  .spc-fade { animation: none; opacity: 1; }
}
`;

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

type ChartLayout = {
  width: number;
  height: number;
  fontSize: number;
};

const COMPACT_LAYOUT: ChartLayout = { width: 320, height: 250, fontSize: 11 };
const WIDE_LAYOUT: ChartLayout = { width: 480, height: 270, fontSize: 12 };

export function SeatPricingChart({
  competitorName,
  tiers,
  extraSeatPrice,
  maxSeats = 25,
  className,
}: SeatPricingChartProps) {
  return (
    <figure aria-hidden className={cn("@container w-full", className)}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <ChartSvg
        className="@min-[28rem]:hidden"
        layout={COMPACT_LAYOUT}
        competitorName={competitorName}
        tiers={tiers}
        extraSeatPrice={extraSeatPrice}
        maxSeats={maxSeats}
      />
      <ChartSvg
        className="hidden @min-[28rem]:block"
        layout={WIDE_LAYOUT}
        competitorName={competitorName}
        tiers={tiers}
        extraSeatPrice={extraSeatPrice}
        maxSeats={maxSeats}
      />
    </figure>
  );
}

type ChartSvgProps = {
  className: string;
  layout: ChartLayout;
  competitorName: string;
  tiers: SeatPricingTier[];
  extraSeatPrice: number | undefined;
  maxSeats: number;
};

function ChartSvg({
  className,
  layout,
  competitorName,
  tiers,
  extraSeatPrice,
  maxSeats,
}: ChartSvgProps) {
  const { width, height, fontSize } = layout;
  const plotLeft = fontSize * 3.4;
  const plotRight = width - fontSize * 0.5;
  const plotTop = fontSize * 3;
  const plotBottom = height - fontSize * 2.2;

  const members = Array.from({ length: maxSeats }, (_, i) => i + 1);
  const competitorCosts = members.map((n) =>
    getCompetitorMonthlyCost(tiers, n, extraSeatPrice),
  );
  const hostedCosts = members.map(getHostedMonthlyCost);
  const selfHostedCosts = members.map(() => SELF_HOSTED_PRICE);

  const highestCost = Math.max(...competitorCosts, ...hostedCosts, 1);
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

  const x = (n: number) =>
    plotLeft + ((n - 1) / Math.max(maxSeats - 1, 1)) * (plotRight - plotLeft);
  const y = (cost: number) =>
    plotBottom - (cost / yMax) * (plotBottom - plotTop);

  // Step-after path: each price holds until the member count that changes it.
  const toStepPath = (costs: number[]) =>
    costs
      .map((cost, i) =>
        i === 0 ? `M${x(1)} ${y(cost)}` : `H${x(i + 1)} V${y(cost)}`,
      )
      .join(" ");

  const lastIndex = maxSeats - 1;
  const lines = [
    {
      key: "competitor",
      label: competitorName,
      costs: competitorCosts,
      strokeClassName: "stroke-muted-foreground",
      textClassName: "fill-muted-foreground",
      strokeWidth: 1.5,
      labelBelow: false,
    },
    {
      key: "hosted",
      label: "FasterFixes hosted",
      costs: hostedCosts,
      strokeClassName: "stroke-primary",
      textClassName: "fill-primary",
      strokeWidth: 2.25,
      // Below its line: the competitor's steps cross the space above it.
      labelBelow: true,
    },
    {
      key: "self-hosted",
      label: "Self-hosted",
      costs: selfHostedCosts,
      strokeClassName: "stroke-foreground",
      textClassName: "fill-foreground",
      strokeWidth: 2.25,
      labelBelow: false,
    },
  ];

  // The second tier's ceiling is where per-seat billing has already kicked in.
  const annotatedSeats = tiers
    .slice(1)
    .find((tier) => tier.seats < maxSeats)?.seats;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-auto w-full overflow-visible", className)}
      fontSize={fontSize}
    >
      <text
        x={0}
        y={fontSize}
        className="fill-muted-foreground font-mono"
        fontSize={fontSize * 0.9}
      >
        Monthly cost
      </text>

      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={plotLeft}
            x2={plotRight}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-border"
            strokeDasharray={tick === 0 ? undefined : "3 4"}
          />
          <text
            x={plotLeft - fontSize * 0.6}
            y={y(tick)}
            dy="0.35em"
            textAnchor="end"
            className="fill-muted-foreground font-mono"
            fontSize={fontSize * 0.9}
          >
            ${tick}
          </text>
        </g>
      ))}

      {xTicks.map((tick) => {
        const isLast = tick === maxSeats;
        return (
          <text
            key={tick}
            x={x(tick)}
            y={plotBottom + fontSize * 1.6}
            textAnchor={isLast ? "end" : "middle"}
            className="fill-muted-foreground font-mono"
            fontSize={fontSize * 0.9}
          >
            {isLast ? `${tick} members` : tick}
          </text>
        );
      })}

      {lines.map((line, i) => (
        <path
          key={line.key}
          d={toStepPath(line.costs)}
          pathLength={1}
          fill="none"
          strokeWidth={line.strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={cn("spc-line", line.strokeClassName)}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}

      {lines.map((line) => {
        const cost = line.costs[lastIndex] ?? 0;
        return (
          <text
            key={line.key}
            x={plotRight}
            y={
              line.labelBelow
                ? y(cost) + fontSize * 1.4
                : y(cost) - fontSize * 0.6
            }
            textAnchor="end"
            className={cn("spc-fade font-medium", line.textClassName)}
            style={{ animationDelay: `${DRAW_SECONDS}s` }}
          >
            {line.label}
            <tspan dx={fontSize * 0.4} className="font-mono font-normal">
              ${cost}
            </tspan>
          </text>
        );
      })}

      {annotatedSeats === undefined ? null : (
        <SeatAnnotation
          cx={x(annotatedSeats)}
          cy={y(competitorCosts[annotatedSeats - 1] ?? 0)}
          cost={competitorCosts[annotatedSeats - 1] ?? 0}
          seats={annotatedSeats}
          fontSize={fontSize}
        />
      )}
    </svg>
  );
}

type SeatAnnotationProps = {
  cx: number;
  cy: number;
  cost: number;
  seats: number;
  fontSize: number;
};

function SeatAnnotation({
  cx,
  cy,
  cost,
  seats,
  fontSize,
}: SeatAnnotationProps) {
  return (
    <g
      className="spc-fade"
      style={{ animationDelay: `${DRAW_SECONDS * 0.8}s` }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        strokeWidth={1.5}
        className="fill-background stroke-muted-foreground"
      />
      <text
        x={cx + fontSize * 0.5}
        y={cy + fontSize * 1.5}
        className="fill-muted-foreground font-mono"
        fontSize={fontSize * 0.9}
      >
        ${cost} at {seats}
      </text>
    </g>
  );
}
