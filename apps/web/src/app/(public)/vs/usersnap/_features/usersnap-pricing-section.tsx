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
  formatPrice,
  formatPublishedPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
import { VsActions } from "../../_features/vs-actions";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";
import { SectionBody } from "../../../features/_components/section-body";

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
    <VsSection eyebrow="Pricing" title="How much Usersnap really costs">
      <SectionBody className="max-w-3xl">
        <p>
          Usersnap does not charge per seat beyond Starter. It charges per
          project: {starter.name} {formatPrice(starter)}/mo covers{" "}
          {starter.seats} seats and {starter.projects} projects, then every
          higher tier has unlimited seats and is sized by projects:{" "}
          {growth.name} {formatPrice(growth)}/mo ({growth.projects} projects),{" "}
          {professional.name} {formatPrice(professional)}/mo (
          {professional.projects} projects) and {premium.name}{" "}
          {formatPrice(premium)}/mo ({premium.projects} projects). A five-person
          team pays {formatPublishedPrice(growth, "/mo")} on {growth.name}.
          Usersnap lists its prices in EUR. Billed yearly, they drop to{" "}
          {formatAmount(starter.billedYearlyAmount, starter.currency)},{" "}
          {formatAmount(growth.billedYearlyAmount, growth.currency)},{" "}
          {formatAmount(professional.billedYearlyAmount, professional.currency)}{" "}
          and {formatAmount(premium.billedYearlyAmount, premium.currency)} per
          month. There is no free plan, only a free trial.
        </p>
        <p>
          FasterFixes is open source, so the lowest plan in any honest
          comparison is &quot;free, forever, on your own server.&quot; If you
          would rather not run it yourself, the hosted plans are flat-rate: $
          {proPrice}/mo for Pro and ${agencyPrice}/mo for Agency.
        </p>
      </SectionBody>

      <div className="mt-12 md:mt-16">
        <h3 className="text-xl font-medium tracking-tight">
          Plan for plan, by team size
        </h3>
        <p className="mt-3 max-w-3xl text-pretty text-muted-foreground">
          Usersnap is ahead on one line: {growth.name} includes{" "}
          {growth.projects} projects, so a team with {proPlan.projects + 1} to{" "}
          {growth.projects} projects needs FasterFixes Agency, which has no
          member or project limit.
        </p>
        <div className="mt-8">
          <VsComparisonTable
            competitorName="Usersnap"
            labelHeader="Your team"
            rows={planMatchRows}
            footnote={`Each row is the cheapest plan of each tool that covers the team. Monthly list prices, then Usersnap's billed-yearly rate, Usersnap's checked on usersnap.com/pricing on November 19, 2026. Usersnap bills in EUR and FasterFixes in USD. ${EXCHANGE_RATE_NOTE}`}
          />
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <VsActions
          signupLabel="Start hosted, free"
          githubLabel="Self-host from GitHub"
        />
        <p className="max-w-md text-sm text-muted-foreground md:text-right">
          Usersnap pricing is based on publicly available information and may
          change. Check their site for current rates.
        </p>
      </div>
    </VsSection>
  );
}
