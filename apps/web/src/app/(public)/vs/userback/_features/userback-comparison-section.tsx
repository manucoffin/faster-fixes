import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const { team, business, businessPlus } = COMPETITOR_PRICES.userback.plans;
const { extraSeat } = COMPETITOR_PRICES.userback.otherPrices;

type CellType = "yes" | "no" | "partial";
type Cell = string | { type: CellType; note?: string };

const freeFeedbackLimit = PLAN_LIMITS[SubscriptionPlanName.Free].feedbacks;
const freeProjectLimit = PLAN_LIMITS[SubscriptionPlanName.Free].projects;

const rows: { label: string; cells: [Cell, Cell] }[] = [
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

const headers = ["FasterFixes", "Userback"] as const;

type CellIconProps = { type: CellType };

function CellIcon({ type }: CellIconProps) {
  if (type === "yes") {
    return <CheckIcon className="size-5 text-success" aria-label="Yes" />;
  }

  if (type === "no") {
    return <XIcon className="size-5 text-destructive" aria-label="No" />;
  }

  return (
    <MinusIcon className="size-5 text-muted-foreground" aria-label="Partial" />
  );
}

function renderCell(cell: Cell) {
  if (typeof cell === "string") {
    return <span className="text-sm text-muted-foreground">{cell}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <CellIcon type={cell.type} />
      {cell.note && (
        <span className="text-xs text-muted-foreground">{cell.note}</span>
      )}
    </div>
  );
}

export function UserbackComparisonSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes vs Userback: full feature comparison
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Side-by-side comparison based on each product&apos;s public
            documentation and pricing page.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-sm font-semibold" scope="col">
                  Feature
                </th>
                {headers.map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`p-4 text-left text-sm font-semibold ${
                      i === 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th
                    scope="row"
                    className="p-4 text-left align-top text-sm font-medium"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="p-4 align-top">
                      {renderCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Pricing and feature availability as publicly listed on each
          vendor&apos;s website. Last updated Nov 12, 2026.
        </p>
      </div>
    </section>
  );
}
