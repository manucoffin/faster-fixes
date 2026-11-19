import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, MinusIcon, XIcon } from "lucide-react";

export type VsComparisonCell =
  | string
  | { type: "yes" | "no" | "partial"; note?: string };

export type VsComparisonRow = {
  label: string;
  cells: [VsComparisonCell, VsComparisonCell];
};

type VsComparisonTableProps = {
  competitorName: string;
  rows: VsComparisonRow[];
  footnote: string;
  // Heading of the row-label column, for a table whose rows are not features.
  labelHeader?: string;
};

type ComparisonCellProps = {
  cell: VsComparisonCell;
};

type ComparisonIconProps = {
  type: "yes" | "no" | "partial";
};

function ComparisonIcon({ type }: ComparisonIconProps) {
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

function ComparisonCell({ cell }: ComparisonCellProps) {
  if (typeof cell === "string") {
    return <span className="text-sm text-muted-foreground">{cell}</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      <ComparisonIcon type={cell.type} />
      {cell.note && (
        <span className="text-xs text-muted-foreground">{cell.note}</span>
      )}
    </div>
  );
}

export function VsComparisonTable({
  competitorName,
  rows,
  footnote,
  labelHeader = "Feature",
}: VsComparisonTableProps) {
  const headers = ["FasterFixes", competitorName];

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse tabular-nums">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-[34%] bg-muted p-4 text-left text-sm font-medium md:static md:bg-transparent md:px-6"
                >
                  {labelHeader}
                </th>
                {headers.map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={cn(
                      "w-[33%] p-4 text-left text-sm font-medium md:px-6",
                      index === 0 ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-background p-4 text-left align-top text-sm font-normal md:static md:px-6"
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={index}
                      className={cn(
                        "p-4 align-top md:px-6",
                        index === 0 && "bg-muted/30",
                      )}
                    >
                      <ComparisonCell cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">{footnote}</p>
    </div>
  );
}
