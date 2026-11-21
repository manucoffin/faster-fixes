import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;
const { extraSeat } = COMPETITOR_PRICES.userback.otherPrices;

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;
const freeProjectLimit = PLAN_LIMITS[SubscriptionPlanName.Free].projects;

const keyDifferences: VsPoint[] = [
  {
    title: "Flat price, developer context on every plan",
    body: `FasterFixes Pro is $${proPrice}/month for ${proPlan.seats} members, with console logs, network requests, and session replay included. On Userback they start on ${business.name} at ${formatPrice(business)}/month.`,
  },
  {
    title: "Self-hosted or cloud",
    body: "FasterFixes is open source under AGPL-3.0 and runs on your own infrastructure, so client feedback never leaves it. Userback is closed-source and cloud-only.",
  },
  {
    title: "Built for the codebase",
    body: "Every report carries the DOM selector and React component tree, and reaches your coding agent through MCP. Userback is built for product teams, with surveys, a feature portal, and sentiment analysis.",
  },
];

const rows: VsComparisonRow[] = [
  {
    label: "License",
    cells: ["Open source · AGPL-3.0 app, MIT widget", "Proprietary"],
  },
  {
    label: "Self-hostable",
    cells: [
      { type: "yes", note: "Next.js, Postgres, Inngest, R2/S3" },
      { type: "no", note: "Cloud-only" },
    ],
  },
  {
    label: "Pricing model",
    cells: [
      `Flat per workspace · free, $${proPrice}/mo, $${agencyPrice}/mo`,
      `Seat bundles · ${team.name} ${formatPrice(team)} (${team.seats} seats), ${business.name} ${formatPrice(business)} (${business.seats}), ${businessPlus.name} ${formatPrice(businessPlus)} (${businessPlus.seats}) · extra seats ${formatPrice(extraSeat)}/mo`,
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-hosted · $${proPrice}/mo hosted`,
      `${formatPrice(team)}/mo ${team.name} · ${formatPrice(business)}/mo with developer context`,
    ],
  },
  {
    label: "Free plan",
    cells: [
      {
        type: "yes",
        note: `${freeProjectLimit} project · ${freeFeedbackLimit} items · forever`,
      },
      { type: "yes", note: "2 seats · 2 sites · 7-day history" },
    ],
  },
  {
    label: "Console logs and network requests",
    cells: [
      { type: "yes", note: "All plans" },
      { type: "yes", note: `${business.name} and above` },
    ],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Session replay",
    cells: [
      { type: "yes", note: "Last minute before each feedback · all plans" },
      {
        type: "yes",
        note: `Last 3 min before each report · ${business.name}+`,
      },
    ],
  },
  {
    label: "Screen recording",
    cells: [{ type: "no" }, { type: "yes", note: "Annotated · all plans" }],
  },
  {
    label: "MCP server for AI coding agents",
    cells: [
      { type: "yes", note: "Claude Code, Cursor, Codex · any model" },
      { type: "yes", note: `Claude, ChatGPT, Cursor · ${team.name}+` },
    ],
  },
  {
    label: "Issue tracker sync",
    cells: [
      "Two-way with GitHub, Linear, Jira, Trello",
      "Jira, ClickUp (two-way), Zapier, and more",
    ],
  },
  {
    label: "NPS and microsurveys",
    cells: [{ type: "no" }, { type: "yes", note: `${business.name}+` }],
  },
  {
    label: "Feature request portal",
    cells: [
      { type: "no" },
      {
        type: "yes",
        note: `${team.name} add-on · included on ${business.name}+`,
      },
    ],
  },
];

export function UserbackComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs Userback: full feature comparison"
      intro="Three differences decide most switches. The table below covers the rest, based on each product's public documentation and pricing page."
      tone="muted"
    >
      <VsPointGrid points={keyDifferences} className="md:grid-cols-3" />
      <div className="mt-16">
        <VsComparisonTable
          competitorName="Userback"
          rows={rows}
          footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
        />
      </div>
    </VsSection>
  );
}
