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
import { SectionBody } from "../../../features/_components/section-body";
import { SeatPricingChart } from "../../_components/illustrations/seat-pricing-chart";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsPricingCard,
  VsPricingCards,
} from "../../_features/vs-pricing-cards";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;
const { extraSeat, extraSeatBilledYearly } =
  COMPETITOR_PRICES.userback.otherPrices;
const businessBilledYearly = formatAmount(
  business.billedYearlyAmount,
  business.currency,
);
const businessYearlyOnMonthly = formatAmount(
  business.amount * 12,
  business.currency,
);
const businessYearlyBilledYearly = formatAmount(
  business.billedYearlyAmount * 12,
  business.currency,
);

// Monthly billing, the rate the section quotes; extra seats sit on top of Business.
const userbackTiers = [
  { name: business.name, seats: business.seats, monthlyPrice: business.amount },
];

const cards: VsPricingCard[] = [
  {
    vendor: "FasterFixes · Self-hosted",
    plan: "Open source under AGPL-3.0",
    price: "$0",
    suffix: "/ month, forever",
    note: "Clone the repo, deploy on infrastructure you already pay for, and you owe us nothing. Same product as the hosted version.",
    highlight: true,
  },
  {
    vendor: "FasterFixes · Hosted",
    plan: `Pro plan, up to ${proPlan.seats} members`,
    price: `$${proPrice}`,
    suffix: "/ month",
    note: `Flat rate. Agency tier unlocks unlimited members at $${agencyPrice}/month. No per-seat charges as your team grows.`,
  },
  {
    vendor: `Userback · ${business.name}`,
    plan: "Cloud-only, closed source",
    price: formatPrice(business),
    suffix: `/ month for up to ${business.seats} seats`,
    note: `${businessBilledYearly}/month billed annually. Extra seats are ${formatPrice(extraSeat)}/month each (${formatPrice(extraSeatBilledYearly)} billed annually). Includes session replay, console and network capture, AI Feedback & Insights, surveys, and the Feature Portal. The ${team.name} plan is ${formatPrice(team)}/month for ${team.seats} seats without these features.`,
  },
];

export function UserbackPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="Userback pricing vs FasterFixes: what you actually pay"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionBody>
          <p>
            FasterFixes is open source. The lowest plan in any honest comparison
            is &quot;free, forever, on your own server.&quot; If you would
            rather not run it yourself, the hosted plans are flat-rate, not
            tiered by team size. Userback sells plans with a fixed number of
            seats: {team.name} {formatPrice(team)}/month for {team.seats},{" "}
            {business.name} {formatPrice(business)}/month for {business.seats},{" "}
            {businessPlus.name} {formatPrice(businessPlus)}/month for{" "}
            {businessPlus.seats} (monthly billing), with extra seats at{" "}
            {formatPrice(extraSeat)}/month on {business.name} and above. The{" "}
            {business.name} plan is the closest equivalent to FasterFixes for
            structured bug reporting: {businessYearlyOnMonthly}/year on monthly
            billing, {businessYearlyBilledYearly}/year billed annually.
          </p>
        </SectionBody>

        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8">
          <SeatPricingChart
            competitorName={`Userback ${business.name}`}
            tiers={userbackTiers}
            extraSeatPrice={extraSeat.amount}
          />
        </div>
      </div>

      <div className="mt-12 md:mt-16">
        <VsPricingCards cards={cards} />
      </div>

      <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <VsActions
          signupLabel="Start hosted, free"
          githubLabel="Self-host from GitHub"
        />
        <p className="max-w-md text-sm text-muted-foreground md:text-right">
          Userback pricing is based on publicly available information and may
          change. Check their site for current rates.
        </p>
      </div>
    </VsSection>
  );
}
