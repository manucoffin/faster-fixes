import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import {
  COMPETITOR_PRICES,
  type CompetitorPlan,
} from "@/app/(public)/_helpers/competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatAmount,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { starter, growth, professional, premium } =
  COMPETITOR_PRICES.usersnap.plans;
const fasterFixesPro = `Pro · $${proPrice}/mo`;
const fasterFixesAgency = `Agency · $${agencyPrice}/mo`;

function formatUsersnapPlan(
  plan: CompetitorPlan & { readonly billedYearlyAmount: number },
) {
  return `${plan.name} · ${formatPublishedPrice(plan, "/mo")}, ${formatAmount(plan.billedYearlyAmount, plan.currency)}/mo yearly`;
}

// Each row pairs the cheapest plan of each tool that covers the same team.
const planMatchRows: VsComparisonRow[] = [
  {
    label: `${starter.seats} people, ${starter.projects} projects`,
    cells: [fasterFixesPro, formatUsersnapPlan(starter)],
  },
  {
    label: `${proPlan.seats} people, ${proPlan.projects} projects`,
    cells: [fasterFixesPro, formatUsersnapPlan(growth)],
  },
  {
    label: `Any team, up to ${growth.projects} projects`,
    cells: [fasterFixesAgency, formatUsersnapPlan(growth)],
  },
  {
    label: `Any team, up to ${professional.projects} projects`,
    cells: [fasterFixesAgency, formatUsersnapPlan(professional)],
  },
  {
    label: `Any team, up to ${premium.projects} projects`,
    cells: [fasterFixesAgency, formatUsersnapPlan(premium)],
  },
  {
    label: "On your own server",
    cells: [
      { type: "yes", note: "$0 self-hosted" },
      { type: "no", note: "Cloud-only" },
    ],
  },
];

export function UsersnapPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="FasterFixes vs Usersnap: what each plan costs"
      intro={`Usersnap ${starter.name} covers ${starter.seats} seats, then every tier has unlimited seats and is sized by projects. FasterFixes is flat: $${proPrice}/mo for Pro, $${agencyPrice}/mo for Agency, or $0 self-hosted. Usersnap has no free plan, only a trial.`}
    >
      <VsComparisonTable
        competitorName="Usersnap"
        labelHeader="Your team"
        rows={planMatchRows}
        footnote={`Each row is the cheapest plan of each tool that covers the team. Usersnap ${growth.name} includes ${growth.projects} projects, so a team with ${proPlan.projects + 1} to ${growth.projects} projects needs FasterFixes Agency. Monthly list prices, then Usersnap's billed-yearly rate, checked on usersnap.com/pricing on November 19, 2026. Usersnap bills in EUR and FasterFixes in USD. ${EXCHANGE_RATE_NOTE}`}
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
