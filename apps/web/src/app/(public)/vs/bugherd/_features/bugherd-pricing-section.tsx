import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
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
    note: `Each extra user is ${formatPublishedPrice(extraSeat, "/month")}. Studio (${studio.seats} members) is ${formatPublishedPrice(studio, "/month")}. Premium (${premium.seats} members, client task board, Jira and Linear) is ${formatPublishedPrice(premium, "/month")}. Annual billing saves up to ${bugherd.yearlySavesUpToMonths} months.`,
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
      title="Free if you self-host. Flat rate if you don't."
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionBody>
          <p>
            FasterFixes is open source. The lowest plan in any honest comparison
            is &quot;free, forever, on your own server.&quot; If you would
            rather not run it yourself, the hosted plans are flat-rate, not
            per-seat. BugHerd uses tiered per-seat pricing with extra users
            billed at {formatPublishedPrice(extraSeat, "/month")} each on top of
            the plan.
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
