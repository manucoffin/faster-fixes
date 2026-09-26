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
      "Tiered by seat count · $49/mo Starter to $319/mo Premium",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      "$0 self-host · $20/mo hosted Pro",
      "$49/mo Starter (5 seats, $39/mo billed annually)",
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
    label: "In-dashboard AI",
    cells: [{ type: "partial", note: "Roadmap" }, { type: "no" }],
  },
  {
    label: "Stack support",
    cells: [
      "React / Next.js native · basic HTML embed",
      "Any stack · JS snippet, browser extension",
    ],
  },
  {
    label: "Browser extension",
    cells: [{ type: "no" }, { type: "yes", note: "Chrome, Firefox, Edge" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "Auto context (URL, DOM, browser, viewport)",
    cells: [{ type: "yes" }, { type: "partial", note: "Screenshot only" }],
  },
  {
    label: "NPS / microsurveys",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "Feature request boards",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "Team kanban board",
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "Session replay",
    cells: [{ type: "no" }, { type: "no" }],
  },
  {
    label: "Project management integrations",
    cells: [
      "GitHub, Linear, Jira · more coming",
      "Jira, GitHub, Slack, Zendesk, Azure DevOps, +",
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
    label: "Linear two-way sync",
    cells: [
      { type: "yes", note: "Bidirectional · workflow-state aware" },
      { type: "no" },
    ],
  },
  {
    label: "Custom branding",
    cells: [{ type: "partial", note: "Roadmap" }, { type: "yes" }],
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
      { type: "yes", note: "1 project · 50 items · forever" },
      { type: "partial", note: "Trial only · 20 feedback items" },
    ],
  },
];

const headers = ["FasterFixes", "Usersnap"] as const;

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

export function UsersnapComparisonSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes vs Usersnap: full feature comparison
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
