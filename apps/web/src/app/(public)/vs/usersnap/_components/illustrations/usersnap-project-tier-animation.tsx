import { cn } from "@workspace/ui/lib/utils";
import { ServerIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatPublishedPrice,
  toUsd,
} from "@/app/(public)/_helpers/format-competitor-price";

const CYCLE = 12;

// Percentages of the cycle where each project count starts. The last one holds
// longest, so the widest gap stays on screen.
const PHASE_STARTS = [0, 20, 40, 60] as const;
const PHASE_END = 100;

// Length of a crossfade or a step, in percentages of the cycle.
const FADE = 2;

const { starter, growth, professional, premium } =
  COMPETITOR_PRICES.usersnap.plans;

// Usersnap publishes EUR prices only, so the bars compare USD equivalents
// against the FasterFixes USD prices.
const USERSNAP_TIERS = [starter, growth, professional, premium].map((tier) => ({
  ...tier,
  monthlyUsd: toUsd(tier.amount, tier.currency),
}));

const MAX_PROJECTS = Math.max(
  ...USERSNAP_TIERS.map(({ projects }) => projects),
);
const MAX_PRICE_USD = Math.max(
  ...USERSNAP_TIERS.map(({ monthlyUsd }) => monthlyUsd),
);

const HOSTED_PLAN_LABELS = {
  [SubscriptionPlanName.Pro]: "Pro plan",
  [SubscriptionPlanName.Agency]: "Agency plan",
} as const;

function getHostedPlan(projects: number) {
  return projects <= PLAN_LIMITS[SubscriptionPlanName.Pro].projects
    ? SubscriptionPlanName.Pro
    : SubscriptionPlanName.Agency;
}

const HOSTED_PLANS = USERSNAP_TIERS.map(({ projects }) =>
  getHostedPlan(projects),
);

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

type Segment<T> = {
  value: T;
  from: number;
  to: number;
};

// Consecutive phases that show the same value merge into one segment, so a
// label that does not change never crossfades with itself.
function toSegments<T>(values: readonly T[]) {
  return values.reduce<Segment<T>[]>((segments, value, i) => {
    const to = PHASE_STARTS[i + 1] ?? PHASE_END;
    const last = segments[segments.length - 1];
    if (last && last.value === value) {
      last.to = to;
      return segments;
    }
    return [...segments, { value, from: PHASE_STARTS[i] ?? PHASE_END, to }];
  }, []);
}

// Per class, the declarations the reduced-motion block freezes it on: the
// final, most telling state of the cycle.
const finalStates: string[] = [];

// Shown between `from` and `to`, wrapping round so the first segment fades
// back in as the last one fades out.
function during(name: string, from: number, to: number) {
  const isFirst = from === 0;
  const isLast = to === PHASE_END;
  finalStates.push(
    `.${name} { animation: none; ${isLast ? SHOWN : "opacity: 0;"} }`,
  );
  const frames = isFirst
    ? `0%, ${to - FADE}% { ${SHOWN} }
  ${to}%, ${PHASE_END - FADE}% { ${HIDDEN} }
  100% { ${SHOWN} }`
    : `0%, ${from - FADE}% { ${HIDDEN} }
  ${from}%, ${to - FADE}% { ${SHOWN} }
  ${to}%, 100% { ${HIDDEN} }`;
  return `@keyframes ${name} {
  ${frames}
}
.${name} { opacity: ${isFirst ? 1 : 0}; animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

// Holds `declaration(value)` through each phase and steps to the next value
// between phases.
function stepThrough(
  name: string,
  values: readonly number[],
  declaration: (value: number) => string,
) {
  const first = declaration(values[0] ?? 0);
  finalStates.push(
    `.${name} { animation: none; ${declaration(values.at(-1) ?? 0)} }`,
  );
  const frames = values
    .map((value, i) => {
      const from = PHASE_STARTS[i] ?? PHASE_END;
      const to = (PHASE_STARTS[i + 1] ?? PHASE_END) - FADE;
      return `${from}%, ${to}% { ${declaration(value)} }`;
    })
    .join("\n  ");
  return `@keyframes ${name} {
  ${frames}
  100% { ${first} }
}
.${name} { ${first} animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

const scaleX = (ratio: number) => `transform: scaleX(${ratio});`;
const left = (ratio: number) => `left: ${ratio * 100}%;`;

const projectRatios = USERSNAP_TIERS.map(
  ({ projects }) => projects / MAX_PROJECTS,
);

const usersnapSegments = toSegments(USERSNAP_TIERS);
const hostedSegments = toSegments(HOSTED_PLANS);

const styles = `
${usersnapSegments.map(({ from, to }, i) => during(`upt-tier-${i}`, from, to)).join("\n")}
${hostedSegments.map(({ from, to }, i) => during(`upt-hosted-${i}`, from, to)).join("\n")}
${stepThrough("upt-slider-fill", projectRatios, scaleX)}
${stepThrough("upt-slider-thumb", projectRatios, left)}
${stepThrough(
  "upt-usersnap-bar",
  USERSNAP_TIERS.map(({ monthlyUsd }) => monthlyUsd / MAX_PRICE_USD),
  scaleX,
)}
${stepThrough(
  "upt-hosted-bar",
  HOSTED_PLANS.map((plan) => PLAN_PRICES[plan] / MAX_PRICE_USD),
  scaleX,
)}

@media (prefers-reduced-motion: reduce) {
  ${finalStates.join("\n  ")}
}
`;

export type UsersnapProjectTierAnimationProps = {
  className?: string;
};

export function UsersnapProjectTierAnimation({
  className,
}: UsersnapProjectTierAnimationProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "@container flex w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm @[30rem]:gap-4 @[30rem]:p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <ProjectsControl />

      <div className="flex flex-col gap-2">
        <PriceRow
          name="Usersnap"
          detail={
            <Swap>
              {usersnapSegments.map(({ value }, i) => (
                <span key={value.name} className={`upt-tier-${i}`}>
                  {value.name} plan
                </span>
              ))}
            </Swap>
          }
          price={
            <Swap align="end">
              {usersnapSegments.map(({ value }, i) => (
                <span key={value.name} className={`upt-tier-${i}`}>
                  {formatPublishedPrice(value, "/mo")}
                </span>
              ))}
            </Swap>
          }
          bar={<PriceBar fillClassName="upt-usersnap-bar bg-foreground/35" />}
        />

        <PriceRow
          name="FasterFixes hosted"
          detail={
            <Swap>
              {hostedSegments.map(({ value }, i) => (
                <span key={value} className={`upt-hosted-${i}`}>
                  {HOSTED_PLAN_LABELS[value]}
                </span>
              ))}
            </Swap>
          }
          price={
            <Swap align="end">
              {hostedSegments.map(({ value }, i) => (
                <span key={value} className={`upt-hosted-${i}`}>
                  ${PLAN_PRICES[value]}/mo
                </span>
              ))}
            </Swap>
          }
          bar={<PriceBar fillClassName="upt-hosted-bar bg-primary" />}
        />

        <PriceRow
          name="FasterFixes self-hosted"
          detail={
            <span className="inline-flex items-center gap-1">
              <ServerIcon className="size-3 shrink-0" />
              On your server
            </span>
          }
          price={<span className="text-success">$0/mo</span>}
          bar={<PriceBar />}
        />
      </div>
    </div>
  );
}

// The project count the bills below respond to, ticking up like a slider a
// user drags.
function ProjectsControl() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 px-2.5 pt-2 pb-1.5 @[30rem]:px-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-foreground @[30rem]:text-xs">
          Projects
        </span>
        <span className="ml-auto rounded-[4px] border bg-background px-1.5 font-mono text-[11px] leading-5 font-semibold text-foreground tabular-nums @[30rem]:text-xs">
          <Swap align="end">
            {usersnapSegments.map(({ value }, i) => (
              <span key={value.projects} className={`upt-tier-${i}`}>
                {value.projects}
              </span>
            ))}
          </Swap>
        </span>
      </div>

      <div className="relative mx-1.5 h-4">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border">
          <span className="upt-slider-fill absolute inset-0 origin-left rounded-full bg-primary/70" />
        </span>
        <span className="upt-slider-thumb absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm" />
      </div>

      <div className="relative mx-1.5 h-3">
        {USERSNAP_TIERS.map(({ projects }) => (
          <span
            key={projects}
            className="absolute -translate-x-1/2 font-mono text-[9px] leading-3 text-muted-foreground tabular-nums @[30rem]:text-[10px]"
            style={{ left: `${(projects / MAX_PROJECTS) * 100}%` }}
          >
            {projects}
          </span>
        ))}
      </div>
    </div>
  );
}

type PriceRowProps = {
  name: string;
  detail: ReactNode;
  price: ReactNode;
  bar: ReactNode;
};

function PriceRow({ name, detail, price, bar }: PriceRowProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-sm @[30rem]:p-2.5">
      <div className="flex min-w-0 items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[11px] font-medium text-foreground @[30rem]:text-xs">
            {name}
          </span>
          <span className="truncate text-[10px] leading-4 text-muted-foreground @[30rem]:text-[11px]">
            {detail}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[11px] leading-5 font-semibold text-foreground tabular-nums @[30rem]:text-xs">
          {price}
        </span>
      </div>
      {bar}
    </div>
  );
}

type PriceBarProps = {
  fillClassName?: string;
};

// Every bar shares one scale, the most expensive Usersnap tier, so their
// lengths compare directly.
function PriceBar({ fillClassName }: PriceBarProps) {
  return (
    <span className="relative block h-1.5 overflow-hidden rounded-full bg-muted">
      {fillClassName && (
        <span
          className={cn(
            "absolute inset-0 origin-left rounded-full",
            fillClassName,
          )}
        />
      )}
    </span>
  );
}

type SwapProps = {
  align?: "start" | "end";
  children: ReactNode;
};

// Stacks its children in one grid cell so the widest one sets the width and
// the animation crossfades between them in place.
function Swap({ align = "start", children }: SwapProps) {
  return (
    <span
      className={cn(
        "inline-grid *:[grid-area:1/1]",
        align === "end" ? "justify-items-end" : "justify-items-start",
      )}
    >
      {children}
    </span>
  );
}
