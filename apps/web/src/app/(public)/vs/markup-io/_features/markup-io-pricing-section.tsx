import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatAmount } from "../../../_helpers/format-competitor-price";
import {
  markupIoPro,
  markupIoProBefore2025,
} from "../_helpers/markup-io-prices";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const { pro, business } = COMPETITOR_PRICES.markupIo.plans;
const usd = (amount: number) => formatAmount(amount, "USD");
const proYearly = pro.amount * 12;

const rows = [
  {
    label: "Markup.io Pro (50 MarkUps/mo)",
    value: `${markupIoPro}/mo = ${usd(proYearly)}/year`,
  },
  {
    label: "Markup.io Business (200 MarkUps/mo)",
    value: `${usd(business.amount)}/mo = ${usd(business.amount * 12)}/year`,
  },
  {
    label: "Markup.io Enterprise",
    value: "Custom: quote required",
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

export function MarkupIoPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Pricing that doesn&apos;t change on you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Markup.io raised Pro from {markupIoProBefore2025} to {markupIoPro}{" "}
            in January 2025 and removed its free plan. It has no native GitHub,
            Linear, or Jira sync. FasterFixes includes GitHub, Linear, and Jira
            sync on the ${proPrice}/mo plan, and the self-hosted version is
            free.
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
          A 5-person agency saves {usd(proYearly - proPrice * 12)}/year
          switching from Markup.io Pro to FasterFixes Pro. Self-hosting saves
          the full {usd(proYearly)}.
        </p>
      </div>
    </section>
  );
}
