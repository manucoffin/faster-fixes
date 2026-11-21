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
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { starter, team } = COMPETITOR_PRICES.markerIo.plans;
const { extraSeatBilledYearly } = COMPETITOR_PRICES.markerIo.otherPrices;
const starterAnnual = formatAmount(
  starter.billedYearlyAmount,
  starter.currency,
);
const teamAnnual = formatAmount(team.billedYearlyAmount, team.currency);

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;
const freeProjectLimit = PLAN_LIMITS[SubscriptionPlanName.Free].projects;

const keyDifferences: VsPoint[] = [
  {
    title: "Open source and self-hostable",
    body: "FasterFixes is open source under AGPL-3.0 and runs on your own infrastructure, so client feedback never leaves it. Marker.io is closed-source and cloud-only.",
  },
  {
    title: "Flat price, not per seat",
    body: `FasterFixes is $0 self-hosted, or $${proPrice}/month hosted for ${proPlan.seats} members. Marker.io ${starter.name} is ${starterAnnual}/month for ${starter.seats} seats billed yearly, ${team.name} is ${teamAnnual}/month, and each extra seat adds ${formatPrice(extraSeatBilledYearly)}/month.`,
  },
  {
    title: "Feedback reaches your coding agent",
    body: "The MCP server lets Claude Code, Cursor, and Codex read and resolve each report with the model you choose. Marker.io's AI features stay inside its dashboard.",
  },
];

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
      title="FasterFixes vs Marker.io: feature comparison"
      intro="Three differences decide most switches. The table covers the rest, based on each product's public documentation and pricing page."
      tone="muted"
      className="border-t"
    >
      <VsPointGrid points={keyDifferences} className="md:grid-cols-3" />
      <div className="mt-16">
        <VsComparisonTable
          competitorName="Marker.io"
          rows={rows}
          footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
        />
      </div>
    </VsSection>
  );
}
