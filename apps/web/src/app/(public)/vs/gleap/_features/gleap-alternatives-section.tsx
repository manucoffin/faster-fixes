import type { Route } from "next";
import {
  type VsAlternative,
  VsAlternativesSection,
} from "../../_features/vs-alternatives-section";
import {
  ALTERNATIVES_CLOSING_NOTE,
  COMPETITOR_STARTING_PRICES as prices,
  SELF_HOSTED_NOTE,
} from "../../_features/vs-competitor-prices";

const alternatives: VsAlternative[] = [
  {
    name: "FasterFixes",
    verdict:
      "The only tool here you can run yourself. MCP server, React component tree, flat-rate Pro plan.",
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    verdict:
      "Mature and stable. $8/seat for each extra member, and no path to your own servers.",
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    verdict:
      "The best tracker sync in the list. Starter stops at 3 seats, Jira starts on Team.",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    verdict:
      "Built for product teams. A three-person team already pays $159/mo on Growth.",
    startingPrice: prices.usersnap,
    selfHosted: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Userback",
    verdict:
      "A free tier whose feedback expires after 7 days. Console logs and replay start on Business.",
    startingPrice: prices.userback,
    selfHosted: { type: "no" },
    href: "/vs/userback" as Route,
  },
  {
    name: "Atarim",
    verdict:
      "Aimed at WordPress agencies. The price includes AI credits you may never spend.",
    startingPrice: prices.atarim,
    selfHosted: { type: "no" },
    href: "/vs/atarim" as Route,
  },
  {
    name: "Ruttl",
    verdict:
      "Live CSS edits, which nobody else here does. Per-seat pricing and link-back integrations.",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
    href: "/vs/ruttl" as Route,
  },
  {
    name: "Markup.io",
    verdict:
      "Strong on PDFs and images. No free plan since January 2025, no tracker sync.",
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
];

export function GleapAlternativesSection() {
  return (
    <VsAlternativesSection
      title="Gleap alternatives compared"
      intro="Pricing is each vendor's monthly rate, with the annual rate in parentheses. Self-hosted means you can run the product on infrastructure you control, and FasterFixes is the only tool in this list that qualifies."
      alternatives={alternatives}
      closingNote={ALTERNATIVES_CLOSING_NOTE}
    />
  );
}
