import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, LockIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";

// Marker.io annual pricing, per month.
const STARTER_PRICE = 39;
const TEAM_PRICE = 149;

const PRICE_JUMP = (TEAM_PRICE / STARTER_PRICE).toFixed(1);

const MARKER_IO_GATED_FEATURES = [
  "Jira sync",
  "Session replay",
  "Devtools (console, network)",
  "Custom branding",
];

const FREE_PLAN_FEATURES = ["Component tree", "Recording", "MCP access"];

const ROW_STAGGER = 0.06;

const styles = `
@keyframes mtg-row { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes mtg-lock { from { opacity: 0; transform: translateY(-3px) scale(1.25); } to { opacity: 1; transform: none; } }
.mtg-row { opacity: 0; animation: mtg-row 0.4s ease-out forwards; }
.mtg-lock { opacity: 0; transform-origin: center; animation: mtg-lock 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@media (prefers-reduced-motion: reduce) {
  .mtg-row, .mtg-lock { animation: none; opacity: 1; transform: none; }
}
`;

type MarkerIoTierGatingIllustrationProps = {
  className?: string;
};

export function MarkerIoTierGatingIllustration({
  className,
}: MarkerIoTierGatingIllustrationProps) {
  const freePrice = PLAN_PRICES[SubscriptionPlanName.Free];
  const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

  return (
    <div aria-hidden className={cn("@container w-full", className)}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex flex-col">
        <PlanCard name="Marker.io Starter" price={`$${STARTER_PRICE}/mo`}>
          {MARKER_IO_GATED_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.1 + i * ROW_STAGGER} locked>
              {feature}
            </FeatureRow>
          ))}
        </PlanCard>

        <PriceJump />

        <PlanCard name="Marker.io Team" price={`$${TEAM_PRICE}/mo`}>
          {MARKER_IO_GATED_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.5 + i * ROW_STAGGER}>
              {feature}
            </FeatureRow>
          ))}
        </PlanCard>

        <div className="my-3 border-t border-dashed" />

        <PlanCard name="FasterFixes Free" price={`$${freePrice}`} highlighted>
          {FREE_PLAN_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.9 + i * ROW_STAGGER}>
              {feature}
            </FeatureRow>
          ))}
          <FeatureRow
            delay={0.9 + FREE_PLAN_FEATURES.length * ROW_STAGGER}
            muted
            tag={`Pro · $${proPrice}/mo`}
          >
            GitHub, Linear, Jira sync
          </FeatureRow>
        </PlanCard>
      </div>
    </div>
  );
}

type PlanCardProps = {
  name: string;
  price: string;
  highlighted?: boolean;
  children: ReactNode;
};

function PlanCard({ name, price, highlighted, children }: PlanCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2.5 shadow-xs @min-[28rem]:p-3",
        highlighted && "border-primary/40 ring-1 ring-primary/20",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "truncate text-[11px] font-medium @min-[28rem]:text-xs",
            highlighted ? "text-primary" : "text-foreground",
          )}
        >
          {name}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground @min-[28rem]:text-[11px]">
          {price}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 @min-[28rem]:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

type FeatureRowProps = {
  delay: number;
  locked?: boolean;
  muted?: boolean;
  tag?: string;
  children: ReactNode;
};

function FeatureRow({ delay, locked, muted, tag, children }: FeatureRowProps) {
  return (
    <div
      className={cn(
        "mtg-row flex h-7 min-w-0 items-center gap-1.5 rounded px-2 font-mono text-[10px]",
        locked ? "bg-muted/40" : "bg-muted",
        // The upgrade-tier row spans both columns so its tag never truncates.
        tag && "@min-[28rem]:col-span-2",
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {locked ? (
        <LockIcon
          className="mtg-lock size-3 shrink-0 text-muted-foreground/70"
          style={{ animationDelay: `${delay + 0.15}s` }}
        />
      ) : (
        <CheckIcon
          className={cn(
            "size-3 shrink-0",
            muted ? "text-muted-foreground" : "text-success",
          )}
        />
      )}
      <span
        className={cn(
          "min-w-0 truncate text-foreground",
          muted && "text-muted-foreground",
          locked &&
            "text-muted-foreground/70 line-through decoration-muted-foreground/40",
        )}
      >
        {children}
      </span>
      {tag ? (
        <span className="ml-auto shrink-0 rounded-full border px-1.5 text-[9px] leading-4 text-muted-foreground">
          {tag}
        </span>
      ) : null}
    </div>
  );
}

function PriceJump() {
  return (
    <div className="relative flex h-9 items-center pl-5">
      <span className="absolute inset-y-0 left-5 w-px bg-border" />
      <span
        className="mtg-row relative ml-3 rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] text-foreground shadow-xs"
        style={{ animationDelay: "0.4s" }}
      >
        {PRICE_JUMP}× price
        <span className="ml-1.5 text-muted-foreground">
          ${STARTER_PRICE} to ${TEAM_PRICE}
        </span>
      </span>
    </div>
  );
}
