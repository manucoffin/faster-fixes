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
import { VsSection } from "../../_features/vs-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;
const { extraSeat } = COMPETITOR_PRICES.userback.otherPrices;

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;
const freeProjectLimit = PLAN_LIMITS[SubscriptionPlanName.Free].projects;

const rows: VsComparisonRow[] = [
  {
    label: "License",
    cells: ["AGPL-3.0 app · MIT widget", "Proprietary"],
  },
  {
    label: "Public source code",
    cells: [{ type: "yes" }, { type: "no" }],
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
      `Flat per-workspace · free, $${proPrice}/mo, $${agencyPrice}/mo`,
      `Seat bundles · ${team.name} ${formatPrice(team)} (${team.seats} seats), ${business.name} ${formatPrice(business)} (${business.seats}), ${businessPlus.name} ${formatPrice(businessPlus)} (${businessPlus.seats}) · extra seats ${formatPrice(extraSeat)}/mo`,
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      `${formatPrice(team)}/mo ${team.name} · ${formatPrice(business)}/mo ${business.name} · ${formatPrice(businessPlus)}/mo ${businessPlus.name}`,
    ],
  },
  {
    label: "Bring your own AI agent (MCP)",
    cells: [
      { type: "yes", note: "Claude Code, Cursor, Codex · any model" },
      { type: "yes", note: "Claude, ChatGPT, Cursor · Team+" },
    ],
  },
  {
    label: "In-dashboard AI",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes", note: "AI Feedback & Insights (Business+)" },
    ],
  },
  {
    label: "Stack support",
    cells: [
      "Any stack · script tag or React package",
      "Framework-agnostic JS snippet",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Auto context (URL, DOM, browser, viewport)",
    cells: [
      { type: "yes" },
      { type: "partial", note: "Console logs, network (Business+)" },
    ],
  },
  {
    label: "Screen recording",
    cells: [{ type: "no" }, { type: "yes", note: "Annotated · all plans" }],
  },
  {
    label: "Video review (uploaded videos)",
    cells: [
      { type: "yes", note: "Timestamped · area on the frame" },
      { type: "no" },
    ],
  },
  {
    label: "Session replay",
    cells: [
      { type: "yes", note: "Last minute before each feedback · all plans" },
      { type: "yes", note: "Last 3 min before each report · Business+" },
    ],
  },
  {
    label: "NPS / microsurveys",
    cells: [{ type: "no" }, { type: "yes", note: "Business+" }],
  },
  {
    label: "Feature request portal",
    cells: [
      { type: "no" },
      { type: "yes", note: "Team add-on · included on Business+" },
    ],
  },
  {
    label: "Team kanban board",
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira, Trello · more coming",
      "Jira, ClickUp (2-way sync), Zapier, +",
    ],
  },
  {
    label: "Trello sync",
    cells: [
      { type: "yes", note: "Bidirectional · status follows the mapped lists" },
      { type: "yes", note: "Sends feedback as cards" },
    ],
  },
  {
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "no" },
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "Two-way · assign and resolve from Slack" },
    ],
  },
  {
    label: "Custom branding",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes", note: "Business+" },
    ],
  },
  {
    label: "SSO",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "partial", note: "Enterprise, custom pricing" },
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
];

export function UserbackComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs Userback: full feature comparison"
      intro="Side-by-side comparison based on each product's public documentation and pricing page."
      tone="muted"
    >
      <VsComparisonTable
        competitorName="Userback"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
      />
    </VsSection>
  );
}
