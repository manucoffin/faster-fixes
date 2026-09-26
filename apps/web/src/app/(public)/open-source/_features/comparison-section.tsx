import { CheckIcon, XIcon } from "lucide-react";

type Cell = string | { type: "yes" | "no"; note?: string };

const rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  {
    label: "License",
    cells: [
      "AGPL-3.0 / MIT widget",
      "Proprietary",
      "Proprietary",
      "Proprietary",
    ],
  },
  {
    label: "Self-hostable",
    cells: [{ type: "yes" }, { type: "no" }, { type: "no" }, { type: "no" }],
  },
  {
    label: "AI coding agent (MCP)",
    cells: [
      { type: "yes", note: "Claude Code, Cursor, Windsurf" },
      { type: "no" },
      { type: "no" },
      { type: "no" },
    ],
  },
  {
    label: "Pricing model",
    cells: [
      "Free self-hosted · flat hosted plan",
      "~$49/user/month",
      "~$59/user/month",
      "Tiered per-seat",
    ],
  },
  {
    label: "Non-technical client widget",
    cells: [{ type: "yes" }, { type: "yes" }, { type: "yes" }, { type: "yes" }],
  },
  {
    label: "Auto context capture",
    cells: [
      "Screenshot, URL, DOM selector, React tree, browser",
      "Screenshot, annotations",
      "Screenshot, annotations",
      "Screenshot, annotations",
    ],
  },
];

const headers = ["FasterFixes", "BugHerd", "Marker.io", "Usersnap"] as const;

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

export function ComparisonSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Compare
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            How FasterFixes compares
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            FasterFixes vs. the closed-source incumbents in the client-feedback
            space.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
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
          Pricing as publicly listed at time of writing. Check each vendor for
          current plans.
        </p>
      </div>
    </section>
  );
}
