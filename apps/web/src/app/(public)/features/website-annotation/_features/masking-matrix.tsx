import { cn } from "@workspace/ui/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import type { ReactNode } from "react";

type Exposure = "hidden" | "visible";

type Cell = { exposure: Exposure; content: ReactNode };

type Row = {
  id: string;
  subject: ReactNode;
  recording: Cell;
  screenshot: Cell;
};

const rows: Row[] = [
  {
    id: "field-value",
    subject: "A typed field value",
    recording: {
      exposure: "hidden",
      content: "Never captured, no attribute needed",
    },
    screenshot: { exposure: "visible", content: "Still visible" },
  },
  {
    id: "mask",
    subject: (
      <>
        Text under <code>data-ff-mask</code>
      </>
    ),
    recording: {
      exposure: "hidden",
      content: (
        <>
          Replaced with <code>*</code>
        </>
      ),
    },
    screenshot: { exposure: "visible", content: "Still visible" },
  },
  {
    id: "block",
    subject: (
      <>
        An element under <code>data-ff-block</code>
      </>
    ),
    recording: { exposure: "hidden", content: "Empty placeholder, same size" },
    screenshot: { exposure: "hidden", content: "Removed from the image" },
  },
];

const codeStyles =
  "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:whitespace-nowrap";

type ExposureCellProps = { cell: Cell; label: string };

function ExposureCell({ cell, label }: ExposureCellProps) {
  const Icon = cell.exposure === "hidden" ? EyeOffIcon : EyeIcon;

  return (
    <td className="block px-5 pb-4 align-top md:table-cell md:px-6 md:pt-4">
      {/* The header row is hidden on narrow screens, so each cell names its column. */}
      <span className="mb-1 block text-sm text-muted-foreground md:hidden">
        {label}
      </span>
      <span className="flex items-start gap-2.5">
        <Icon
          aria-hidden
          className={cn(
            "mt-1 size-4 shrink-0",
            cell.exposure === "hidden"
              ? "text-success"
              : "text-muted-foreground",
          )}
        />
        <span
          className={
            cell.exposure === "hidden" ? undefined : "text-muted-foreground"
          }
        >
          {cell.content}
        </span>
      </span>
    </td>
  );
}

export function MaskingMatrix() {
  return (
    <div className="rounded-2xl border bg-background">
      <table className={cn("block w-full text-left md:table", codeStyles)}>
        <thead className="hidden md:table-header-group">
          <tr className="border-b text-sm text-muted-foreground">
            <th scope="col" className="px-5 py-4 font-medium md:px-6">
              What the report can contain
            </th>
            <th scope="col" className="px-5 py-4 font-medium md:px-6">
              Recording (last minute)
            </th>
            <th scope="col" className="px-5 py-4 font-medium md:px-6">
              Screenshot
            </th>
          </tr>
        </thead>
        <tbody className="block divide-y md:table-row-group">
          {rows.map((row) => (
            <tr key={row.id} className="block md:table-row">
              <th
                scope="row"
                className="block px-5 py-4 align-top font-medium md:table-cell md:px-6"
              >
                {row.subject}
              </th>
              <ExposureCell
                cell={row.recording}
                label="Recording (last minute)"
              />
              <ExposureCell cell={row.screenshot} label="Screenshot" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
