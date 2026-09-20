import { CheckIcon, MinusIcon, XIcon } from "lucide-react";

type CellType = "yes" | "no" | "partial";
type Cell = string | { type: CellType; note?: string };

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
      "Flat per-workspace · free, $20/mo, $99/mo",
      "Per-seat tiers · $39 Starter, $149 Team (annual)",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      "$0 self-host · $20/mo hosted Pro",
      "$149/mo Team (annual · min for Jira & devtools)",
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
      "React / Next.js native · more frameworks coming",
      "Any stack · JS snippet, browser extension, WordPress",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes", note: "Chrome, Firefox, Safari" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes" }, { type: "no" }],
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
    label: "Session replay / video feedback",
    cells: [{ type: "no" }, { type: "partial", note: "Team plan and above" }],
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
      { type: "yes", note: "Team plan and above" },
    ],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira · more coming",
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
      { type: "yes", note: "1 project · 50 items · forever" },
      { type: "partial", note: "15-day trial · no permanent free plan" },
    ],
  },
];

const headers = ["FasterFixes", "Marker.io"] as const;

function CellIcon({ type }: { type: CellType }) {
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

export function MarkerIoComparisonSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes vs. Marker.io
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
          vendor&apos;s website. Last updated May 12, 2026.
        </p>
      </div>
    </section>
  );
}
