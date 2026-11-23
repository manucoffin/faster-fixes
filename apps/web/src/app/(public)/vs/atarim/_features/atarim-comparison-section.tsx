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
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const atarimPro = COMPETITOR_PRICES.atarim.plans.pro;
const atarimProBilledYearly = formatAmount(
  atarimPro.billedYearlyAmount,
  atarimPro.currency,
);
const atarimProYearlyTotal = formatAmount(
  Math.round(atarimPro.billedYearlyAmount * 12 * 100) / 100,
  atarimPro.currency,
);

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
      `Flat per workspace · free, ${atarimPro.name} ${formatPrice(atarimPro)}/mo or ${atarimProBilledYearly}/mo billed yearly, Enterprise custom · AI credits on top`,
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      `${formatPrice(atarimPro)}/mo ${atarimPro.name} · ${atarimProYearlyTotal}/year billed yearly`,
    ],
  },
  {
    label: "MCP / AI agent integration",
    cells: [
      { type: "yes", note: "Feedback context · Claude Code, Cursor, Codex" },
      { type: "yes", note: "Tasks, sites, workflows · Claude, Codex" },
    ],
  },
  {
    label: "In-dashboard AI",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes", note: "InnerCircle · 6 agents" },
    ],
  },
  {
    label: "Stack support",
    cells: [
      "Any stack · script tag or React package",
      "JS snippet · Chrome extension · WordPress plugin",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes", note: "Chrome only" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Auto context (URL, DOM, browser, viewport)",
    cells: [
      { type: "yes" },
      { type: "partial", note: "Screenshot + URL only" },
    ],
  },
  {
    label: "Screen recording",
    cells: [{ type: "no" }, { type: "no" }],
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
      { type: "no" },
    ],
  },
  {
    label: "Whitelabel / custom branding",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes", note: "Your brand on the client dashboard · Pro" },
    ],
  },
  {
    label: "Client portal",
    cells: [{ type: "no" }, { type: "yes", note: "Login + guest link" }],
  },
  {
    label: "WordPress integration",
    cells: [
      { type: "partial", note: "Script tag · no plugin" },
      { type: "yes", note: "Dedicated plugin" },
    ],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira, Trello · more coming",
      "Jira, Asana, ClickUp, Monday, Trello, Slack, Figma, Zapier, +",
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "Two-way · status, priority, comments from Slack" },
    ],
  },
  {
    label: "Trello sync",
    cells: [
      { type: "yes", note: "Bidirectional · status follows the mapped lists" },
      { type: "yes" },
    ],
  },
  {
    label: "GitHub two-way sync",
    cells: [{ type: "yes" }, { type: "partial", note: "Via integration" }],
  },
  {
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "no" },
    ],
  },
  {
    label: "Free plan",
    cells: [
      {
        type: "yes",
        note: `${freeProjectLimit} project · ${freeFeedbackLimit} items · forever`,
      },
      { type: "yes", note: "1 project · 200 AI credits, one time" },
    ],
  },
  {
    label: "Open-source self-hosting",
    cells: [{ type: "yes", note: "$0 forever" }, { type: "no" }],
  },
];

export function AtarimComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs Atarim: feature comparison"
      intro="Side by side, from each product's public documentation. Three rows decide most switches: self-hosting, the context attached to a report, and who does the fixing."
    >
      <VsComparisonTable
        competitorName="Atarim"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
      />
    </VsSection>
  );
}
