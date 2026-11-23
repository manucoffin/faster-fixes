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

const { pro } = COMPETITOR_PRICES.atarim.plans;
const atarimProMonthly = formatPrice(pro);
const atarimProYearly = formatAmount(pro.billedYearlyAmount, pro.currency);

const fasterFixesPro = `Pro · $${proPrice}/mo`;
const fasterFixesAgency = `Agency · $${agencyPrice}/mo`;
const atarimProCell = `${pro.name} · ${atarimProMonthly}/mo, ${atarimProYearly}/mo yearly`;

// Each row pairs the cheapest plan of each tool that covers the same team.
const planMatchRows: VsComparisonRow[] = [
  {
    label: `Up to ${proPlan.seats} members, up to ${proPlan.projects} projects`,
    cells: [fasterFixesPro, atarimProCell],
  },
  {
    label: "20 members",
    cells: [fasterFixesAgency, atarimProCell],
  },
  {
    label: `${pro.seats} members`,
    cells: [fasterFixesAgency, atarimProCell],
  },
  {
    label: "On your own server",
    cells: [
      { type: "yes", note: "$0 self-hosted" },
      { type: "no", note: "Cloud-only" },
    ],
  },
];

export function AtarimPricingSection() {
  return (
    <VsSection
      eyebrow="Pricing"
      title="Atarim pricing vs FasterFixes"
      intro={`Atarim sells one plan: ${pro.name} at ${atarimProMonthly}/mo, or ${atarimProYearly}/mo billed yearly, flat up to ${pro.seats} seats, with AI credits on top. FasterFixes Pro is $${proPrice}/mo for up to ${proPlan.seats} members and ${proPlan.projects} projects, Agency is $${agencyPrice}/mo with no limit, and self-hosting is $0. Past ${proPlan.seats} members or ${proPlan.projects} projects, Atarim is the cheaper hosted bill.`}
      tone="muted"
    >
      <VsComparisonTable
        competitorName="Atarim"
        labelHeader="Your team"
        rows={planMatchRows}
        footnote={`Each row is the cheapest plan that covers the team. FasterFixes also has a free plan: ${freePlan.projects} project, ${freePlan.feedbacks} Feedback items and ${freePlan.seats} member, with self-hosting at $0 whatever the team size. Atarim pricing is based on publicly available information and may change.`}
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
