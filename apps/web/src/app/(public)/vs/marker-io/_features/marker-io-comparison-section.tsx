import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import { formatAmount } from "@/app/(public)/_helpers/format-competitor-price";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { starter, team } = COMPETITOR_PRICES.markerIo.plans;
const starterAnnual = formatAmount(
  starter.billedYearlyAmount,
  starter.currency,
);
const teamAnnual = formatAmount(team.billedYearlyAmount, team.currency);

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
      `Per-seat tiers · ${starterAnnual} Starter, ${teamAnnual} Team (annual)`,
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      `${teamAnnual}/mo Team (annual · min for Jira & devtools)`,
    ],
  },
  {
    label: "Bring your own AI agent (MCP)",
    cells: [
      { type: "yes", note: "Claude Code, Cursor, Codex · any model" },
      { type: "no" },
    ],
  },
  {
    label: "AI assistant in the dashboard",
    cells: [
      { type: "no" },
      { type: "yes", note: "AI Title, Magic Rewrite, Translation · Beta" },
    ],
  },
  {
    label: "Stack support",
    cells: [
      "Any stack · script tag or React package",
      "Any stack · JS snippet, browser extension, WordPress",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes", note: "Chrome, Firefox, Safari" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Auto context (URL, DOM, browser, viewport)",
    cells: [
      { type: "yes" },
      { type: "yes", note: "Network logs on Team plan" },
    ],
  },
  {
    label: "Team kanban board",
    cells: [{ type: "yes" }, { type: "yes" }],
  },
  {
    label: "Client-facing task board",
    cells: [
      { type: "no", note: "On the roadmap" },
      { type: "yes", note: "Guest Portal" },
    ],
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
      { type: "yes", note: "Last 3 min before each report · Team+" },
    ],
  },
  {
    label: "Feedback on Figma, PDFs, images",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "Jira sync",
    cells: [
      { type: "yes", note: "Bidirectional · status-category aware" },
      { type: "partial", note: "Team plan and above" },
    ],
  },
  {
    label: "GitHub issue sync",
    cells: [{ type: "yes", note: "Bidirectional" }, { type: "yes" }],
  },
  {
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "yes", note: "All plans" },
    ],
  },
  {
    label: "Trello sync",
    cells: [
      { type: "yes", note: "Bidirectional · status follows the mapped lists" },
      { type: "partial", note: "Resolves when the card is Done in Trello" },
    ],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira, Trello · more coming",
      "Jira, Linear, Asana, ClickUp, Trello, Monday.com, +",
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status · per project" },
      { type: "yes", note: "New issue, comment, status · all plans" },
    ],
  },
  {
    label: "Custom branding",
    cells: [
      "Self-host: full · hosted: planned",
      { type: "partial", note: "Team plan and above" },
    ],
  },
  {
    label: "SSO",
    cells: [
      "Self-host: bring your own",
      { type: "partial", note: "Business plan only" },
    ],
  },
  {
    label: "Free plan",
    cells: [
      {
        type: "yes",
        note: `${freeProjectLimit} project · ${freeFeedbackLimit} items · forever`,
      },
      { type: "partial", note: "15-day trial · no permanent free plan" },
    ],
  },
];

export function MarkerIoComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs. Marker.io"
      intro="Side-by-side comparison based on each product's public documentation and pricing page."
    >
      <VsComparisonTable
        competitorName="Marker.io"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
      />
    </VsSection>
  );
}
