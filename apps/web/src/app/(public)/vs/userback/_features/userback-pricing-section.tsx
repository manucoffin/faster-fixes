import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "../../../_helpers/format-competitor-price";
import { SectionBody } from "../../../features/_components/section-body";
import { SeatPricingChart } from "../../_components/illustrations/seat-pricing-chart";
import { VsActions } from "../../_features/vs-actions";
import { VsSection } from "../../_features/vs-section";
import { UserbackPricingCalculator } from "./userback-pricing-calculator.client";

const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business } = COMPETITOR_PRICES.userback.plans;
const { extraSeat } = COMPETITOR_PRICES.userback.otherPrices;
const businessYearlyOnMonthly = formatAmount(
  business.amount * 12,
  business.currency,
);

// Monthly billing, the rate the section quotes; extra seats sit on top of Business.
const userbackTiers = [
  { name: business.name, seats: business.seats, monthlyPrice: business.amount },
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
            Userback charges by seat bundle. {business.name}, the first plan
            with console logs, network requests, and session replay, is{" "}
            {formatPrice(business)}/month for {business.seats} seats, then{" "}
            {formatPrice(extraSeat)}/month per extra seat. That is{" "}
            {businessYearlyOnMonthly}/year on monthly billing. {team.name}, at{" "}
            {formatPrice(team)}/month, leaves that context out.
          </p>
          <p>
            FasterFixes is free to self-host under AGPL-3.0. Hosted plans are
            flat: the price does not change as the team grows, and Agency covers
            unlimited members at ${agencyPrice}/month.
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
        <UserbackPricingCalculator />
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
