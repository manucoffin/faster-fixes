import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { SeatPricingChart } from "../../_components/illustrations/seat-pricing-chart";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsPricingCard,
  VsPricingCards,
} from "../../_features/vs-pricing-cards";
import { VsSection } from "../../_features/vs-section";
import { SectionBody } from "../../../features/_components/section-body";

const { bugherd } = COMPETITOR_PRICES;
const { standard, studio, premium } = bugherd.plans;
const { extraSeat } = bugherd.otherPrices;

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
    vendor: "BugHerd · Standard",
    plan: `${standard.seats} members included`,
    price: formatPrice(standard),
    suffix: "/ month",
    note: `Each extra user is ${formatPublishedPrice(extraSeat, "/month")}. Annual billing saves up to ${bugherd.yearlySavesUpToMonths} months.`,
  },
];

// BugHerd's public tiers, monthly billing: the chart reads the same numbers as the cards.
const bugherdTiers = [standard, studio, premium].map((plan) => ({
  name: plan.name,
  seats: plan.seats,
  monthlyPrice: plan.amount,
}));

export function BugherdPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="BugHerd pricing vs FasterFixes: what you actually pay"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionBody>
          <p>
            BugHerd charges per seat. {standard.name} is{" "}
            {formatPublishedPrice(standard, "/month")} for {standard.seats}{" "}
            members, or{" "}
            {formatAmount(standard.billedYearlyAmount, standard.currency)}
            /month billed yearly, and each extra user adds{" "}
            {formatPublishedPrice(extraSeat, "/month")}. {studio.name} covers{" "}
            {studio.seats} members at {formatPublishedPrice(studio, "/month")}.{" "}
            {premium.name}, the first plan with Jira and Linear, covers{" "}
            {premium.seats} at {formatPublishedPrice(premium, "/month")}. There
            is no free plan, only a 7-day trial.
          </p>
          <p>
            FasterFixes is free to self-host under AGPL-3.0. Hosted plans are
            flat: Pro is ${proPrice}/month for {proPlan.seats} members, and
            Agency covers unlimited members at ${agencyPrice}/month.
          </p>
        </SectionBody>

        <div className="rounded-2xl bg-muted/50 p-4 sm:p-8">
          <SeatPricingChart
            competitorName="BugHerd"
            tiers={bugherdTiers}
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
        <p className="text-sm text-muted-foreground">
          Prices reflect each vendor&apos;s public pricing page at time of
          writing.
        </p>
      </div>
    </VsSection>
  );
}
