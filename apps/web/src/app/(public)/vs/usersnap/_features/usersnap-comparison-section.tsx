import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

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
      "Tiered by project count · €49/mo Starter to €459/mo Premium",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      "€129/mo Growth · Starter has 2 seats",
    ],
  },
  {
    label: "Bring your own AI agent (MCP)",
    cells: [
      {
        type: "yes",
        note: "Selector, Screenshot, Recording, console, network · sets Status",
      },
      {
        type: "partial",
        note: "Searches feedback, creates and updates opportunities · cannot edit feedback",
      },
    ],
  },
  {
    label: "In-dashboard AI",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes", note: "Topics, sentiment, AI chat · varies by plan" },
    ],
  },
  {
    label: "Stack support",
    cells: [
      "Any stack · script tag or React package",
      "Any stack · JS snippet, browser extension",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes", note: "All plans" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Auto context (URL, DOM, browser, viewport)",
    cells: [
      { type: "yes" },
      {
        type: "partial",
        note: "URL, browser, device, console · no DOM selector",
      },
    ],
  },
  {
    label: "In-app surveys",
    cells: [
      { type: "no" },
      { type: "yes", note: "Targeting and logic · all plans" },
    ],
  },
  {
    label: "Public roadmap and idea voting",
    cells: [{ type: "no" }, { type: "partial", note: "Professional and up" }],
  },
  {
    label: "Team kanban board",
    cells: [{ type: "yes" }, { type: "no" }],
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
      { type: "no", note: "Manual screen recording only" },
    ],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira, Trello · more coming",
      "Jira, Linear, Asana, Azure DevOps, GitHub, +",
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "New feedback + status events · one-way" },
    ],
  },
  {
    label: "Trello sync",
    cells: [
      { type: "yes", note: "Bidirectional · status follows the mapped lists" },
      { type: "partial", note: "Pushes items · not in its two-way sync list" },
    ],
  },
  {
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "yes", note: "Status sync · maps Default and Resolved" },
    ],
  },
  {
    label: "Custom branding",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "partial", note: "Premium and Enterprise" },
    ],
  },
  {
    label: "SSO",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "partial", note: "Enterprise plan only" },
    ],
  },
  {
    label: "Free plan",
    cells: [
      {
        type: "yes",
        note: `${freeProjectLimit} project · ${freeFeedbackLimit} items · forever`,
      },
      { type: "partial", note: "Free trial, plus a free month of Premium" },
    ],
  },
];

export function UsersnapComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs Usersnap: full feature comparison"
      intro="Side-by-side comparison based on each product's public documentation and pricing page."
      tone="muted"
    >
      <VsComparisonTable
        competitorName="Usersnap"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 19, 2026."
      />
    </VsSection>
  );
}
