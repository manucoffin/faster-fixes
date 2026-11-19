import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import {
  type VsComparisonRow,
  VsComparisonTable,
} from "../../_features/vs-comparison-table";
import { VsSection } from "../../_features/vs-section";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

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
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "Pricing model",
    cells: [
      "Free self-host · flat hosted plans",
      "Per-seat tiers · $8/extra user/month (monthly billing)",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      "$50/mo Standard ($42/mo annual)",
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
      { type: "yes", note: "BugHerd AI · Beta · bundled" },
    ],
  },
  {
    label: "Stack support",
    cells: [
      "Any stack · script tag or React package",
      "Any stack · JS tag or Chrome extension",
    ],
  },
  {
    label: "Chrome extension",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Auto context (screenshot, URL, DOM, browser)",
    cells: [{ type: "yes" }, { type: "yes" }],
  },
  {
    label: "Kanban board (team)",
    cells: [{ type: "yes" }, { type: "yes" }],
  },
  {
    label: "Client-facing task board",
    cells: [
      { type: "no", note: "On the roadmap" },
      { type: "yes", note: "Premium plan and above" },
    ],
  },
  {
    label: "Screen recording",
    cells: [
      { type: "no" },
      { type: "yes", note: "Up to 1 minute · all plans" },
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
      { type: "no", note: "Links to LogRocket or FullStory sessions" },
    ],
  },
  {
    label: "Feedback on Figma, PDFs, images",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "GitHub issue sync",
    cells: [{ type: "yes", note: "Bidirectional" }, { type: "yes" }],
  },
  {
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "yes", note: "Premium plan and above" },
    ],
  },
  {
    label: "Trello sync",
    cells: [
      { type: "yes", note: "Bidirectional · status follows the mapped lists" },
      { type: "yes", note: "All plans" },
    ],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira, Trello · more coming",
      "Trello, GitHub, Slack on all plans · Jira, Linear, Asana, ClickUp, Monday.com from Premium",
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "New tasks, comments, archived · one-way" },
    ],
  },
  {
    label: "Custom branding",
    cells: [
      "Self-host: full · hosted: planned",
      { type: "yes", note: "Premium plan and above" },
    ],
  },
  {
    label: "SSO",
    cells: [
      "Self-host: bring your own",
      { type: "yes", note: "Custom plan only" },
    ],
  },
];

export function BugherdComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="FasterFixes vs. BugHerd"
      intro="Side-by-side comparison based on each product's public documentation and pricing page."
    >
      <VsComparisonTable
        competitorName="BugHerd"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 12, 2026."
      />
    </VsSection>
  );
}
