import { CheckIcon, MinusIcon, XIcon } from "lucide-react";

type Cell = string | { type: "yes" | "no" | "partial"; note?: string };

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
      "Per-seat tiers · ~$69/mo Startup, ~$249/mo Company",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: [
      "$0 self-host · $20/mo hosted Pro",
      "~$69/mo Startup (15 seats included)",
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
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "no" },
    ],
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
    cells: [
      { type: "yes" },
      { type: "partial", note: "Screenshot only" },
    ],
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
      "GitHub today · more coming",
      "Jira, GitHub, Slack, Zendesk, Azure DevOps, +",
    ],
  },
  {
    label: "Custom branding",
    cells: [
      { type: "partial", note: "Roadmap" },
      { type: "yes" },
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
      { type: "yes", note: "1 project · 50 items · forever" },
      { type: "partial", note: "Trial only · no permanent free plan" },
    ],
  },
];

const headers = ["FasterFixes", "Usersnap"] as const;

function renderCell(cell: Cell) {
  if (typeof cell === "string") {
    return <span className="text-muted-foreground text-sm">{cell}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {cell.type === "yes" ? (
        <CheckIcon className="text-success size-5" aria-label="Yes" />
      ) : cell.type === "no" ? (
        <XIcon className="text-destructive size-5" aria-label="No" />
      ) : (
        <MinusIcon
          className="text-muted-foreground size-5"
          aria-label="Partial"
        />
      )}
      {cell.note && (
        <span className="text-muted-foreground text-xs">{cell.note}</span>
      )}
    </div>
  );
}

export function UsersnapComparisonSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes vs Usersnap: full feature comparison
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
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

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          Pricing and feature availability as publicly listed on each
          vendor&apos;s website. Last updated April 27, 2026.
        </p>
      </div>
    </section>
  );
}
