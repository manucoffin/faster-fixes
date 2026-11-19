import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, LockIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";

// Userback monthly billing, the price a team pays without an annual commitment.
const { team, business } = COMPETITOR_PRICES.userback.plans;
const TEAM_PRICE = formatAmount(team.amount, team.currency);
const BUSINESS_PRICE = formatAmount(business.amount, business.currency);

const PRICE_JUMP = (business.amount / team.amount).toFixed(1);

const USERBACK_GATED_FEATURES = [
  "Console logs",
  "Network requests",
  "Session replay",
];

const PRO_PLAN_FEATURES = ["Console logs", "Network requests", "Recording"];

const ROW_STAGGER = 0.06;

const styles = `
@keyframes utg-row { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes utg-lock { from { opacity: 0; transform: translateY(-3px) scale(1.25); } to { opacity: 1; transform: none; } }
.utg-row { opacity: 0; animation: utg-row 0.4s ease-out forwards; }
.utg-lock { opacity: 0; transform-origin: center; animation: utg-lock 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@media (prefers-reduced-motion: reduce) {
  .utg-row, .utg-lock { animation: none; opacity: 1; transform: none; }
}
`;

type UserbackTierGatingIllustrationProps = {
  className?: string;
};

export function UserbackTierGatingIllustration({
  className,
}: UserbackTierGatingIllustrationProps) {
  const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
  const proSeats = PLAN_LIMITS[SubscriptionPlanName.Pro].seats;

  return (
    <div aria-hidden className={cn("@container w-full", className)}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex flex-col">
        <PlanCard name={`Userback ${team.name}`} price={`${TEAM_PRICE}/mo`}>
          {USERBACK_GATED_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.1 + i * ROW_STAGGER} locked>
              {feature}
            </FeatureRow>
          ))}
        </PlanCard>

        <PriceJump />

        <PlanCard
          name={`Userback ${business.name}`}
          price={`${BUSINESS_PRICE}/mo`}
        >
          {USERBACK_GATED_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.5 + i * ROW_STAGGER}>
              {feature}
            </FeatureRow>
          ))}
        </PlanCard>

        <div className="my-3 border-t border-dashed" />

        <PlanCard
          name="FasterFixes Pro"
          price={`$${proPrice}/mo`}
          note={`Flat, up to ${proSeats} members`}
          highlighted
        >
          {PRO_PLAN_FEATURES.map((feature, i) => (
            <FeatureRow key={feature} delay={0.9 + i * ROW_STAGGER}>
              {feature}
            </FeatureRow>
          ))}
        </PlanCard>
      </div>
    </div>
  );
}

type PlanCardProps = {
  name: string;
  price: string;
  note?: string;
  highlighted?: boolean;
  children: ReactNode;
};

function PlanCard({ name, price, note, highlighted, children }: PlanCardProps) {
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
          {note ? (
            <span className="ml-1.5 rounded-full border px-1.5 text-[9px] leading-4">
              {note}
            </span>
          ) : null}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 @min-[28rem]:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

type FeatureRowProps = {
  delay: number;
  locked?: boolean;
  children: ReactNode;
};

function FeatureRow({ delay, locked, children }: FeatureRowProps) {
  return (
    <div
      className={cn(
        "utg-row flex h-7 min-w-0 items-center gap-1.5 rounded px-2 font-mono text-[10px]",
        locked ? "bg-muted/40" : "bg-muted",
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {locked ? (
        <LockIcon
          className="utg-lock size-3 shrink-0 text-muted-foreground/70"
          style={{ animationDelay: `${delay + 0.15}s` }}
        />
      ) : (
        <CheckIcon className="size-3 shrink-0 text-success" />
      )}
      <span
        className={cn(
          "min-w-0 truncate text-foreground",
          locked &&
            "text-muted-foreground/70 line-through decoration-muted-foreground/40",
        )}
      >
        {children}
      </span>
    </div>
  );
}

function PriceJump() {
  return (
    <div className="relative flex h-9 items-center pl-5">
      <span className="absolute inset-y-0 left-5 w-px bg-border" />
      <span
        className="utg-row relative ml-3 rounded-full border bg-background px-2 py-0.5 font-mono text-[10px] text-foreground shadow-xs"
        style={{ animationDelay: "0.4s" }}
      >
        {PRICE_JUMP}× price
        <span className="ml-1.5 text-muted-foreground">
          {TEAM_PRICE} to {BUSINESS_PRICE}
        </span>
      </span>
    </div>
  );
}
