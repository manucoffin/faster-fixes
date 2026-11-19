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
const { plans, otherPrices } = COMPETITOR_PRICES.gleap;
const { hobby, growth } = plans;
const usd = (amount: number) => formatAmount(amount, "USD");

const teamSize = 5;
const extraSeats = teamSize - growth.seats;
const growthMonthly = growth.amount + extraSeats * otherPrices.extraSeat.amount;
const growthYearly =
  growth.billedYearlyAmount * 12 +
  extraSeats * otherPrices.extraSeatPerYear.amount;

const rows = [
  {
    label: `Gleap Growth (${teamSize} people, monthly)`,
    value: `${usd(growthMonthly)}/mo = ${usd(growthMonthly * 12)}/year`,
  },
  {
    label: `Gleap Growth (${teamSize} people, yearly)`,
    value: `${usd(growthYearly)}/year (about ${usd(Math.round(growthYearly / 12))}/mo)`,
  },
  {
    label: `FasterFixes Pro (up to ${proPlan.seats})`,
    value: `$${proPrice}/mo = $${proPrice * 12}/year`,
    highlight: true,
  },
];

export function GleapPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">Pricing comparison</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Gleap&apos;s Hobby plan ({usd(hobby.billedYearlyAmount)}/mo billed
            yearly, {formatPrice(hobby)}/mo monthly) is limited to {hobby.seats}{" "}
            seat and {hobby.projects} project, not viable for any real team. For{" "}
            {teamSize} people, the minimum is Growth: {growth.seats} seats
            included, plus {extraSeats} extra seat at{" "}
            {formatPrice(otherPrices.extraSeat)}/mo or{" "}
            {formatPrice(otherPrices.extraSeatPerYear)}/year.
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
          Note: Gleap AI (Kai) is not included in any plan. It is billed from a
          prepaid balance, at about {formatPrice(otherPrices.aiConversation)}{" "}
          per conversation.
        </p>
      </div>
    </section>
  );
}
