import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "../../../_helpers/format-competitor-price";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const ruttlPro = COMPETITOR_PRICES.ruttl.plans.pro;
const teamSize = 5;
const ruttlTeamMonthly = ruttlPro.amount * teamSize;
const usd = (amount: number) => formatAmount(amount, "USD");
const ruttlTeamYearly = ruttlTeamMonthly * 12;
const proSavings = usd(ruttlTeamYearly - proPrice * 12);

const rows = [
  {
    label: `Ruttl Pro (${teamSize} people)`,
    value: `${usd(ruttlTeamMonthly)}/mo = ${usd(ruttlTeamYearly)}/year`,
  },
  {
    label: "Ruttl Business",
    value: "Custom: contact sales",
  },
  {
    label: `FasterFixes Pro (up to ${proPlan.seats})`,
    value: `$${proPrice}/mo = $${proPrice * 12}/year`,
    highlight: true,
  },
  {
    label: "FasterFixes self-hosted",
    value: "$0",
    highlight: true,
  },
];

export function RuttlPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Free if you self-host. Flat rate if you don&apos;t.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Ruttl Pro is {formatPrice(ruttlPro)} per user per month. Every new
            teammate adds {formatPrice(ruttlPro)}. FasterFixes is flat: one
            price for up to {proPlan.seats} members, or $0 if you self-host.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-xl border bg-muted/30">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 border-b p-5 last:border-b-0 ${
                row.highlight ? "bg-background" : ""
              }`}
            >
              <span className="text-sm font-medium md:text-base">
                {row.label}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums md:text-base">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
          A {teamSize}-person team saves {proSavings}/year switching from Ruttl
          Pro to FasterFixes Pro. Self-hosting saves the full{" "}
          {usd(ruttlTeamYearly)}.
        </p>
      </div>
    </section>
  );
}
