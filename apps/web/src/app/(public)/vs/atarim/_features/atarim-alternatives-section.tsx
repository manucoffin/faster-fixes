import { CheckIcon, XIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type Alternative = {
  name: string;
  bestFor: string;
  startingPrice: string;
  openSource: { type: "yes"; note: string } | { type: "no" };
  href?: Route;
  highlight?: boolean;
};

const alternatives: Alternative[] = [
  {
    name: "FasterFixes",
    bestFor:
      "Dev agencies building React/Next.js apps; self-hosted feedback with MCP + GitHub sync",
    startingPrice: "Free (self-hosted)",
    openSource: { type: "yes", note: "AGPL-3.0 + MIT" },
    highlight: true,
  },
  {
    name: "BugHerd",
    bestFor:
      "Agencies collecting client feedback on websites via sticky-note pins; on-page guest portal",
    startingPrice: "$39/mo",
    openSource: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    bestFor:
      "Internal dev QA and bug reporting with screenshot annotation and PM tool sync",
    startingPrice: "$39/mo",
    openSource: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    bestFor:
      "SaaS product teams collecting end-user feedback, NPS, and microsurveys",
    startingPrice: "$49/mo",
    openSource: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Gleap",
    bestFor:
      "SaaS teams needing all-in-one bug reporting, live chat, session replay, and roadmap",
    startingPrice: "$49/mo",
    openSource: { type: "no" },
  },
  {
    name: "Feedbucket",
    bestFor:
      "Web agencies managing client website reviews with deep two-way PM tool sync",
    startingPrice: "$29/mo",
    openSource: { type: "no" },
  },
];

export function AtarimAlternativesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Alternatives
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Best Atarim alternatives in 2026
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Not every team needs the same thing. Here is how the main
            alternatives stack up.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Tool
                </th>
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Best for
                </th>
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Starting price
                </th>
                <th scope="col" className="p-4 text-left text-sm font-semibold">
                  Open source
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
                  <th
                    scope="row"
                    className="p-4 text-left align-top text-sm font-semibold"
                  >
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
                  </th>
                  <td className="text-muted-foreground p-4 align-top text-sm">
                    {row.bestFor}
                  </td>
                  <td className="text-muted-foreground p-4 align-top text-sm">
                    {row.startingPrice}
                  </td>
                  <td className="p-4 align-top">
                    {row.openSource.type === "yes" ? (
                      <div className="flex flex-col gap-1">
                        <CheckIcon
                          className="text-success size-5"
                          aria-label="Yes"
                        />
                        <span className="text-muted-foreground text-xs">
                          {row.openSource.note}
                        </span>
                      </div>
                    ) : (
                      <XIcon
                        className="text-destructive size-5"
                        aria-label="No"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground mx-auto mt-8 max-w-3xl text-center text-sm">
          FasterFixes is the only tool in this list with a permanent free
          tier, self-hosting support, and an MCP server for AI coding agents.
        </p>
      </div>
    </section>
  );
}
