import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { SeatPricingChart } from "../../_components/illustrations/seat-pricing-chart";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsPricingCard,
  VsPricingCards,
} from "../../_features/vs-pricing-cards";
import { VsSection } from "../../_features/vs-section";
import { SectionBody } from "../../../features/_components/section-body";

const { starter, team } = COMPETITOR_PRICES.markerIo.plans;
const { extraSeatBilledYearly } = COMPETITOR_PRICES.markerIo.otherPrices;
const starterAnnual = formatAmount(
  starter.billedYearlyAmount,
  starter.currency,
);
const teamAnnual = formatAmount(team.billedYearlyAmount, team.currency);

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

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
    vendor: "Marker.io · Team",
    plan: `${team.seats} seats included (annual billing)`,
    price: teamAnnual,
    suffix: "/ month",
    note: `Required to unlock Jira, session replay, and developer tools. Extra seats ${formatPrice(extraSeatBilledYearly)}/month each. Starter is ${starterAnnual}/month annual but excludes Jira and devtools.`,
  },
];

// Team is the cheapest Marker.io plan with Jira, session replay and devtools,
// so the chart compares against it rather than the cheaper Starter seats.
const markerIoTiers = [
  { name: team.name, seats: team.seats, monthlyPrice: team.billedYearlyAmount },
];

export function MarkerIoPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="Free if you self-host. Flat rate if you don't."
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionBody>
          <p>
            FasterFixes is open source. The lowest plan in any honest comparison
            is &quot;free, forever, on your own server.&quot; If you would
            rather not run it yourself, the hosted plans are flat-rate, not
            per-seat. Marker.io uses tiered per-seat pricing where Jira sync,
            session replay, and developer tools are gated behind the Team plan
            at {teamAnnual}/month annual.
          </p>
        </SectionBody>

        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8">
          <SeatPricingChart
            competitorName="Marker.io Team"
            tiers={markerIoTiers}
            extraSeatPrice={extraSeatBilledYearly.maxAmount}
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
        <p className="text-sm text-muted-foreground">
          Prices reflect each vendor&apos;s public pricing page at time of
          writing.
        </p>
      </div>
    </VsSection>
  );
}
