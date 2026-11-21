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
const { extraSeat, extraSeatBilledYearly } =
  COMPETITOR_PRICES.markerIo.otherPrices;
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
      title="Marker.io pricing vs FasterFixes: what you actually pay"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionBody>
          <p>
            Marker.io charges per seat. {starter.name} is {formatPrice(starter)}
            /month for {starter.seats} seats, or {starterAnnual}/month billed
            yearly. {team.name} covers {team.seats} seats at {formatPrice(team)}
            /month, or {teamAnnual}/month billed yearly. Extra seats cost{" "}
            {formatPrice(extraSeat)}/month, or{" "}
            {formatPrice(extraSeatBilledYearly)}/month billed yearly. Jira sync,
            session replay, console and network logs are {team.name} only, so a
            team that needs them pays {teamAnnual}/month, not {starterAnnual}.
            There is no free plan, only a 15-day trial.
          </p>
          <p>
            FasterFixes is free to self-host under AGPL-3.0. Hosted plans are
            flat: Pro is ${proPrice}/month for {proPlan.seats} members, and
            Agency covers unlimited members at ${agencyPrice}/month. The
            Recording and the MCP server are on every plan, Free included.
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
