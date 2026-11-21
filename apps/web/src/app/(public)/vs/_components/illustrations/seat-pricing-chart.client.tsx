"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { cn } from "@workspace/ui/lib/utils";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export type SeatPricingRow = {
  members: number;
  competitor: number;
  hosted: number;
  selfHosted: number;
};

type SeriesKey = Exclude<keyof SeatPricingRow, "members">;

type SeatPricingPlotProps = {
  rows: SeatPricingRow[];
  xTicks: number[];
  yTicks: number[];
  competitorLabel: string;
  hostedLabel: string;
  selfHostedLabel: string;
  className?: string;
};

const formatMembers = (members: number) =>
  members === 1 ? "1 member" : `${members} members`;

export function SeatPricingPlot({
  rows,
  xTicks,
  yTicks,
  competitorLabel,
  hostedLabel,
  selfHostedLabel,
  className,
}: SeatPricingPlotProps) {
  const config = {
    competitor: { label: competitorLabel, color: "var(--muted-foreground)" },
    hosted: { label: hostedLabel, color: "var(--primary)" },
    selfHosted: { label: selfHostedLabel, color: "var(--foreground)" },
  } satisfies Record<SeriesKey, ChartConfig[string]>;
  const firstMembers = rows[0]?.members ?? 1;
  const lastMembers = rows.at(-1)?.members ?? 1;
  const lastIndex = rows.length - 1;

  return (
    <ChartContainer
      config={config}
      // The table rendered beside the chart carries the same numbers for assistive tech.
      aria-hidden
      className={cn(
        "aspect-auto h-[260px] w-full [&_.recharts-cartesian-axis-tick_text]:font-mono",
        className,
      )}
    >
      <LineChart data={rows} margin={{ top: 20, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" />
        <XAxis
          dataKey="members"
          type="number"
          domain={[firstMembers, lastMembers]}
          ticks={xTicks}
          tick={<MembersTick lastMembers={lastMembers} />}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          domain={[0, yTicks.at(-1) ?? 0]}
          ticks={yTicks}
          tickFormatter={(value: number) => `$${value}`}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 4" }}
          content={
            <ChartTooltipContent
              className="min-w-44"
              labelFormatter={(_, payload) => {
                const row = payload[0]?.payload as SeatPricingRow | undefined;
                return row === undefined ? null : formatMembers(row.members);
              }}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">
                    {config[name as SeriesKey].label}
                  </span>
                  <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                    {typeof value === "number" ? `$${value}` : null}
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="competitor"
          type="stepAfter"
          stroke="var(--color-competitor)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          label={
            <EndLabel
              text={competitorLabel}
              lastIndex={lastIndex}
              placement="above"
              className="fill-muted-foreground"
            />
          }
        />
        <Line
          dataKey="hosted"
          type="stepAfter"
          stroke="var(--color-hosted)"
          strokeWidth={2.25}
          dot={false}
          isAnimationActive={false}
          label={
            <EndLabel
              text={hostedLabel}
              lastIndex={lastIndex}
              // Below its line: the competitor's steps cross the space above it.
              placement="below"
              className="fill-primary"
            />
          }
        />
        <Line
          dataKey="selfHosted"
          type="stepAfter"
          stroke="var(--color-selfHosted)"
          strokeWidth={2.25}
          dot={false}
          isAnimationActive={false}
          label={
            <EndLabel
              text={selfHostedLabel}
              lastIndex={lastIndex}
              placement="above"
              className="fill-foreground"
            />
          }
        />
      </LineChart>
    </ChartContainer>
  );
}

// Recharts clones this element for each tick and fills in the position props.
type MembersTickProps = {
  lastMembers: number;
  x?: number;
  y?: number;
  payload?: { value: number };
};

function MembersTick({ lastMembers, x, y, payload }: MembersTickProps) {
  if (payload === undefined) return null;
  const isLast = payload.value === lastMembers;
  return (
    <text
      x={x}
      y={y}
      dy="0.71em"
      textAnchor={isLast ? "end" : "middle"}
      className="fill-muted-foreground font-mono"
    >
      {isLast ? formatMembers(payload.value) : payload.value}
    </text>
  );
}

// Recharts clones this element for each point of the line; only the last one draws.
type EndLabelProps = {
  text: string;
  lastIndex: number;
  placement: "above" | "below";
  className: string;
  x?: number;
  y?: number;
  index?: number;
  value?: number;
};

function EndLabel({
  text,
  lastIndex,
  placement,
  className,
  x,
  y,
  index,
  value,
}: EndLabelProps) {
  if (index !== lastIndex || x === undefined || y === undefined) return null;
  return (
    <text
      x={x}
      y={placement === "above" ? y - 8 : y + 16}
      textAnchor="end"
      className={cn("font-medium", className)}
    >
      {text}
      <tspan dx={5} className="font-mono font-normal">
        ${value}
      </tspan>
    </text>
  );
}
