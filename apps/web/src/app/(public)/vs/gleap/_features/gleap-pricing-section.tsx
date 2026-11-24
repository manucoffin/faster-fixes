import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { plans, otherPrices } = COMPETITOR_PRICES.gleap;
const { hobby, growth, pro } = plans;
const usd = (amount: number) => formatAmount(amount, "USD");

// Growth includes a few seats, then bills each extra seat monthly or yearly.
function growthCell(teamSize: number) {
  const extraSeats = teamSize - growth.seats;
  const monthly = growth.amount + extraSeats * otherPrices.extraSeat.amount;
  const yearly =
    (growth.billedYearlyAmount * 12 +
      extraSeats * otherPrices.extraSeatPerYear.amount) /
    12;
  const seatNote =
    extraSeats > 0
      ? ` + ${extraSeats} extra seat${extraSeats > 1 ? "s" : ""}`
      : "";
  return `${growth.name}${seatNote} · ${usd(monthly)}/mo, ${usd(Math.round(yearly))}/mo yearly`;
}

const hobbyCell = `${hobby.name} · ${usd(hobby.amount)}/mo, ${usd(hobby.billedYearlyAmount)}/mo yearly`;
const proCell = `${pro.name} · ${usd(pro.amount)}/mo, ${usd(pro.billedYearlyAmount)}/mo yearly`;
const fasterFixesPro = `Pro · $${proPrice}/mo`;
const fasterFixesAgency = `Agency · $${agencyPrice}/mo`;

// Each row pairs the cheapest plan of each tool that covers the same team. From
// 14 seats, Gleap Pro undercuts Growth plus extra seats, monthly or yearly.
const planMatchRows: VsComparisonRow[] = [
  {
    label: `${freePlan.seats} person, ${freePlan.projects} project`,
    cells: [`Free · $0, ${freePlan.feedbacks} Feedback items`, hobbyCell],
  },
  {
    label: `${growth.seats} people`,
    cells: [fasterFixesPro, growthCell(growth.seats)],
  },
  {
    label: `${proPlan.seats} people, up to ${proPlan.projects} projects`,
    cells: [fasterFixesPro, growthCell(proPlan.seats)],
  },
  {
    label: "10 people",
    cells: [fasterFixesAgency, growthCell(10)],
  },
  {
    label: "20 people or more",
    cells: [fasterFixesAgency, proCell],
  },
  {
    label: "On your own server",
    cells: [
      { type: "yes", note: "$0 self-hosted" },
      { type: "no", note: "Cloud-only" },
    ],
  },
];

export function GleapPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="FasterFixes vs Gleap: what each plan costs"
      intro={`Gleap pricing starts at ${usd(hobby.billedYearlyAmount)}/mo billed yearly for ${hobby.seats} seat, then Growth includes ${growth.seats} seats and bills ${usd(otherPrices.extraSeat.amount)} for each extra one. There is no free plan, only a 7-day trial, and the AI agent is billed on top. FasterFixes is flat: $${proPrice}/mo for Pro, $${agencyPrice}/mo for Agency, or $0 self-hosted.`}
      tone="muted"
    >
      <VsComparisonTable
        competitorName="Gleap"
        labelHeader="Your team"
        rows={planMatchRows}
        footnote={`Each row is the cheapest plan of each tool that covers the team. Gleap lists extra seats at ${usd(otherPrices.extraSeat.amount)}/mo, or ${usd(otherPrices.extraSeatPerYear.amount)}/year on yearly billing. Kai, Gleap's AI agent, is not in any plan: it draws on a prepaid balance at about ${formatAmount(otherPrices.aiConversation.amount, "USD")} per conversation. Checked on gleap.ai/pricing on November 24, 2026.`}
      />

      <div className="mt-10">
        <VsActions
          signupLabel="Start hosted, free"
          githubLabel="Self-host from GitHub"
        />
      </div>
    </VsSection>
  );
}
