import { CheckIcon, XIcon } from "lucide-react";

type Cell = string | { type: "yes" | "no"; note?: string };

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
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "Pricing model",
    cells: [
      "Free self-host · flat hosted plans",
      "Per-seat tiers · $8/extra user/month",
    ],
  },
  {
    label: "Cost for a 5-person team",
    cells: ["$0 self-host · $20/mo hosted Pro", "$50/mo Standard"],
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
      "React / Next.js native · more frameworks coming",
      "Any stack · JS tag or Chrome extension",
    ],
  },
  {
    label: "Chrome extension",
    cells: [{ type: "no" }, { type: "yes" }],
  },
  {
    label: "React component tree capture",
    cells: [{ type: "yes" }, { type: "no" }],
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
      { type: "yes", note: "Premium plan only" },
    ],
  },
  {
    label: "Video feedback",
    cells: [{ type: "no" }, { type: "yes" }],
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
    label: "Project management integrations",
    cells: [
      "GitHub today · more coming",
      "Jira, Asana, ClickUp, Monday.com, Linear, +",
    ],
  },
  {
    label: "Custom branding",
    cells: [
      "Self-host: full · hosted: planned",
      { type: "yes", note: "Premium plan only" },
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

const headers = ["FasterFixes", "BugHerd"] as const;

function renderCell(cell: Cell) {
  if (typeof cell === "string") {
    return <span className="text-muted-foreground text-sm">{cell}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {cell.type === "yes" ? (
        <CheckIcon className="text-success size-5" aria-label="Yes" />
      ) : (
        <XIcon className="text-destructive size-5" aria-label="No" />
      )}
      {cell.note && (
        <span className="text-muted-foreground text-xs">{cell.note}</span>
      )}
    </div>
  );
}

export function BugherdComparisonSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes vs. BugHerd
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
          vendor&apos;s website. Last updated April 25, 2026.
        </p>
      </div>
    </section>
  );
}
