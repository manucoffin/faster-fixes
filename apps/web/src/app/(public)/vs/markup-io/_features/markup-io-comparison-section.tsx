import { CheckIcon, XIcon } from "lucide-react";

type Cell = string | { type: "yes" | "no"; note?: string };

const rows: { label: string; cells: [Cell, Cell] }[] = [
  {
    label: "License",
    cells: ["AGPL-3.0 / MIT", "Proprietary"],
  },
  {
    label: "Self-hosting",
    cells: [{ type: "yes" }, { type: "no", note: "Cloud-only" }],
  },
  {
    label: "Pricing model",
    cells: [
      "$0 self-hosted / $20/mo Pro (up to 5 members)",
      "$79/mo Pro / Enterprise custom",
    ],
  },
  {
    label: "Free plan",
    cells: [
      { type: "yes", note: "Free forever: self-hosted or hosted" },
      { type: "no", note: "Removed January 2025" },
    ],
  },
  {
    label: "Integrations (GitHub, Linear, Jira)",
    cells: [
      { type: "yes", note: "GitHub, Linear, Jira included from $20/mo" },
      { type: "no", note: "Enterprise-only" },
    ],
  },
  {
    label: "Slack notifications",
    cells: [
      { type: "yes", note: "New feedback + live status, per project" },
      { type: "yes", note: "Comment alerts to DM or channel" },
    ],
  },
  {
    label: "MCP server (Claude Code / Cursor)",
    cells: [{ type: "yes" }, { type: "no" }],
  },
  {
    label: "React component tree capture",
    cells: [
      { type: "yes", note: "Component name, props, DOM selector" },
      { type: "no" },
    ],
  },
  {
    label: "Chrome extension required",
    cells: [
      { type: "no", note: "In-page widget" },
      { type: "yes", note: "For auth-gated & localhost URLs" },
    ],
  },
  {
    label: "Client guest access (no account)",
    cells: [{ type: "yes" }, { type: "yes" }],
  },
  {
    label: "React package",
    cells: [
      { type: "yes", note: "Plus a script tag for any site" },
      { type: "no", note: "Generic browser tool" },
    ],
  },
];

const headers = ["FasterFixes", "Markup.io"] as const;

function renderCell(cell: Cell) {
  if (typeof cell === "string") {
    return <span className="text-sm text-muted-foreground">{cell}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {cell.type === "yes" ? (
        <CheckIcon className="size-5 text-success" aria-label="Yes" />
      ) : (
        <XIcon className="size-5 text-destructive" aria-label="No" />
      )}
      {cell.note && (
        <span className="text-xs text-muted-foreground">{cell.note}</span>
      )}
    </div>
  );
}

export function MarkupIoComparisonSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Markup.io vs FasterFixes
          </h2>
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
      </div>
    </section>
  );
}
