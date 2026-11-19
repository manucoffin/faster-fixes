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

type VsAlternativesSectionProps = {
  title: string;
  intro: string;
  alternatives: VsAlternative[];
  closingNote?: string;
};

export function VsAlternativesSection({
  title,
  intro,
  alternatives,
  closingNote,
}: VsAlternativesSectionProps) {
  const showBestFor = alternatives.some((row) => row.bestFor);

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Alternatives
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Tool
                </th>
                {showBestFor && (
                  <th
                    scope="col"
                    className="p-4 text-left text-sm font-semibold"
                  >
                    Best for
                  </th>
                )}
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Starting price
                </th>
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Self-hosted
                </th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((row) => (
                <tr
                  key={row.name}
                  className={`border-b last:border-b-0 ${
                    row.highlight ? "bg-muted/30" : ""
                  }`}
                >
                  <th scope="row" className="p-4 text-left align-top text-sm">
                    <span className="font-semibold">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="text-foreground underline underline-offset-4 hover:no-underline"
                        >
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}
                    </span>
                    {row.verdict && (
                      <span className="mt-1 block font-normal text-muted-foreground">
                        {row.verdict}
                      </span>
                    )}
                  </th>
                  {showBestFor && (
                    <td className="p-4 align-top text-sm text-muted-foreground">
                      {row.bestFor}
                    </td>
                  )}
                  <td className="p-4 align-top text-sm text-muted-foreground">
                    {row.startingPrice}
                  </td>
                  <td className="p-4 align-top">
                    {row.selfHosted.type === "yes" ? (
                      <div className="flex flex-col gap-1">
                        <CheckIcon
                          className="size-5 text-success"
                          aria-label="Yes"
                        />
                        <span className="text-xs text-muted-foreground">
                          {row.selfHosted.note}
                        </span>
                      </div>
                    ) : (
                      <XIcon
                        className="size-5 text-destructive"
                        aria-label="No"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {closingNote && (
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
            {closingNote}
          </p>
        )}
      </div>
    </section>
  );
}
