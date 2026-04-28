import { CheckIcon, XIcon } from "lucide-react";

type Alternative = {
  name: string;
  bestFor: string;
  startingPrice: string;
  openSource: { type: "yes"; note: string } | { type: "no" };
  highlight?: boolean;
};

const alternatives: Alternative[] = [
  {
    name: "FasterFixes",
    bestFor: "Dev teams wanting self-hosted, AI-ready feedback",
    startingPrice: "Free (self-hosted)",
    openSource: { type: "yes", note: "AGPL-3.0" },
    highlight: true,
  },
  {
    name: "BugHerd",
    bestFor: "Agencies managing client QA visually",
    startingPrice: "$39/mo",
    openSource: { type: "no" },
  },
  {
    name: "Marker.io",
    bestFor: "Teams already using Jira, Linear, or Asana",
    startingPrice: "$49/mo",
    openSource: { type: "no" },
  },
  {
    name: "Userback",
    bestFor: "Product teams needing session replay with feedback",
    startingPrice: "$59/mo",
    openSource: { type: "no" },
  },
  {
    name: "Gleap",
    bestFor: "SaaS products combining in-app support and feedback",
    startingPrice: "$49/mo",
    openSource: { type: "no" },
  },
  {
    name: "Feedbucket",
    bestFor: "Small agencies wanting a simple hosted widget",
    startingPrice: "$29/mo",
    openSource: { type: "no" },
  },
];

export function UsersnapAlternativesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Alternatives
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Best Usersnap alternatives in 2026
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Not every team needs the same thing. Here is how the main
            alternatives stack up — including FasterFixes.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b">
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-semibold"
                >
                  Tool
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-semibold"
                >
                  Best for
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-semibold"
                >
                  Starting price
                </th>
                <th
                  scope="col"
                  className="p-4 text-left text-sm font-semibold"
                >
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
                    {row.name}
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
          FasterFixes is the only tool in this list with a permanent free tier,
          self-hosting support, and an MCP server for AI coding agents.
        </p>
      </div>
    </section>
  );
}
