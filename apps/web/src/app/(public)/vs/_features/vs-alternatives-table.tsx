import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, XIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export type VsAlternative = {
  name: string;
  verdict?: string;
  bestFor?: string;
  startingPrice: string;
  selfHosted: { type: "yes"; note: string } | { type: "no" };
  href?: Route;
  highlight?: boolean;
};

type VsAlternativesTableProps = {
  alternatives: VsAlternative[];
  closingNote?: string;
};

type SelfHostedCellProps = {
  selfHosted: VsAlternative["selfHosted"];
};

function SelfHostedCell({ selfHosted }: SelfHostedCellProps) {
  if (selfHosted.type === "no") {
    return <XIcon className="size-5 text-destructive" aria-label="No" />;
  }
  return (
    <div className="flex flex-col gap-1">
      <CheckIcon className="size-5 text-success" aria-label="Yes" />
      <span className="text-xs text-muted-foreground">{selfHosted.note}</span>
    </div>
  );
}

// The tool-by-tool verdict table at the top of a "<competitor> alternatives" page.
export function VsAlternativesTable({
  alternatives,
  closingNote,
}: VsAlternativesTableProps) {
  const showBestFor = alternatives.some((row) => row.bestFor);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse tabular-nums">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  scope="col"
                  className="w-[40%] p-4 text-left text-sm font-medium md:px-6"
                >
                  Tool
                </th>
                {showBestFor && (
                  <th
                    scope="col"
                    className="p-4 text-left text-sm font-medium md:px-6"
                  >
                    Best for
                  </th>
                )}
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-medium md:px-6"
                >
                  Starting price
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-medium md:px-6"
                >
                  Self-hosted
                </th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((row) => (
                <tr
                  key={row.name}
                  className={cn(
                    "border-b last:border-b-0",
                    row.highlight && "bg-muted/30",
                  )}
                >
                  <th
                    scope="row"
                    className="p-4 text-left align-top text-sm font-normal md:px-6"
                  >
                    <span className="font-medium text-foreground">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="underline underline-offset-4 hover:no-underline"
                        >
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}
                    </span>
                    {row.verdict && (
                      <span className="mt-1 block leading-relaxed text-pretty text-muted-foreground">
                        {row.verdict}
                      </span>
                    )}
                  </th>
                  {showBestFor && (
                    <td className="p-4 align-top text-sm leading-relaxed text-muted-foreground md:px-6">
                      {row.bestFor}
                    </td>
                  )}
                  <td className="p-4 align-top text-sm leading-relaxed text-muted-foreground md:px-6">
                    {row.startingPrice}
                  </td>
                  <td className="p-4 align-top md:px-6">
                    <SelfHostedCell selfHosted={row.selfHosted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {closingNote && (
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
          {closingNote}
        </p>
      )}
    </div>
  );
}
