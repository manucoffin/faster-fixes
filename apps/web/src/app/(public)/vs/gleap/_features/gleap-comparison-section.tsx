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

const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

const { plans, otherPrices } = COMPETITOR_PRICES.gleap;
const { hobby, growth } = plans;
const usd = (amount: number) => formatAmount(amount, "USD");

const fiveSeatYearly =
  growth.billedYearlyAmount * 12 +
  (5 - growth.seats) * otherPrices.extraSeatPerYear.amount;

const rows: VsComparisonRow[] = [
  {
    label: "License",
    cells: ["AGPL-3.0 app · MIT widget", "Proprietary · MIT SDKs"],
  },
  {
    label: "Self-hostable",
    cells: [
      { type: "yes", note: "Next.js, Postgres, Inngest, R2/S3" },
      { type: "no", note: "Cloud-only, EU or US hosting" },
    ],
  },
  {
    label: "Pricing model",
    cells: [
      `Flat per workspace · free, $${proPrice}/mo, $${agencyPrice}/mo`,
      `Seats included per plan · ${hobby.name} ${usd(hobby.billedYearlyAmount)}/mo to ${growth.name} ${usd(growth.billedYearlyAmount)}/mo billed yearly, then ${usd(otherPrices.extraSeat.amount)}/seat · AI on top`,
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      `$0 self-host · $${proPrice}/mo hosted Pro`,
      `${usd(growth.amount + (5 - growth.seats) * otherPrices.extraSeat.amount)}/mo ${growth.name} · ${usd(fiveSeatYearly)}/year billed yearly`,
    ],
  },
  {
    label: "Free plan",
    cells: [
      {
        type: "yes",
        note: `${freePlan.projects} project · ${freePlan.feedbacks} items · forever`,
      },
      { type: "no", note: "7-day trial" },
    ],
  },
  {
    label: "MCP server",
    cells: [
      { type: "yes", note: "Feedback with its context · every plan" },
      { type: "yes", note: "Support tickets · Growth and up" },
    ],
  },
  {
    label: "AI coding agent",
    cells: [
      { type: "yes", note: "Your own: Claude Code, Cursor, Codex" },
      { type: "yes", note: "Kai Code, hosted · Growth and up, usage-billed" },
    ],
  },
  {
    label: "AI support chatbot",
    cells: [{ type: "no" }, { type: "yes", note: "Kai · prepaid balance" }],
  },
  {
    label: "Live chat and ticketing",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "Help center",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "Web install",
    cells: [
      "Script tag · React, Vue, Angular, Svelte packages",
      "JavaScript SDK",
    ],
  },
  {
    label: "Mobile SDKs",
    cells: [
      { type: "no", note: "Web only" },
      { type: "yes", note: "iOS, Android, React Native, Flutter, Ionic" },
    ],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes", note: "On React sites" }, { type: "no" }],
  },
  {
    label: "Console logs and network requests",
    cells: [
      { type: "yes", note: "Every plan" },
      { type: "yes", note: "Every plan" },
    ],
  },
  {
    label: "Session replay",
    cells: [
      { type: "yes", note: "Last minute before each Feedback · every plan" },
      { type: "yes", note: "Last 10 to 15 minutes · Growth and up" },
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
    label: "Issue tracker sync",
    cells: [
      {
        type: "yes",
        note: "GitHub, Linear, Jira, Trello · two-way, every paid plan",
      },
      {
        type: "yes",
        note: `Jira, Linear, GitHub, Asana, ClickUp, + · none on ${hobby.name}`,
      },
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "Notifications" },
    ],
  },
];

export function GleapComparisonSection() {
  return (
    <VsSection
      eyebrow="Compare"
      title="Feature comparison: FasterFixes vs Gleap"
      intro="Side by side, from each product's public documentation. Gleap wins every support row, FasterFixes wins on self-hosting, price and the code context attached to a report."
    >
      <VsComparisonTable
        competitorName="Gleap"
        rows={rows}
        footnote="Pricing and feature availability as publicly listed on each vendor's website. Last updated Nov 24, 2026."
      />
    </VsSection>
  );
}
