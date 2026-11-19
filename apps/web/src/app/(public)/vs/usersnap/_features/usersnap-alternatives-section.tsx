import type { Route } from "next";
import {
  type VsAlternative,
  VsAlternativesTable,
} from "../../_features/vs-alternatives-table";
import {
  ALTERNATIVES_CLOSING_NOTE,
  COMPETITOR_STARTING_PRICES as prices,
  SELF_HOSTED_NOTE,
} from "../../_features/vs-competitor-prices";
import { VsSection } from "../../_features/vs-section";

const alternatives: VsAlternative[] = [
  {
    name: "FasterFixes",
    verdict:
      "The only self-hosted tool here. Every Feedback carries the DOM selector, React component tree, console logs, and network requests.",
    bestFor: "Dev teams wanting self-hosted, AI-ready feedback",
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    verdict:
      "The safest pick for non-technical clients. No free plan, $50/mo for 5 members.",
    bestFor: "Agencies managing client QA visually",
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    verdict:
      "Best tracker sync in the list. Jira, replay, and console logs wait for the Team plan.",
    bestFor: "Teams already using Jira, Linear, or Asana",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Userback",
    verdict: "A real free tier, but feedback expires after 7 days.",
    bestFor: "Product teams needing session replay with feedback",
    startingPrice: prices.userback,
    selfHosted: { type: "no" },
    href: "/vs/userback" as Route,
  },
  {
    name: "Atarim",
    verdict:
      "One flat plan for up to 100 seats. Priced around AI agents, not bug reports.",
    bestFor: "Web agencies running WordPress client review cycles",
    startingPrice: prices.atarim,
    selfHosted: { type: "no" },
    href: "/vs/atarim" as Route,
  },
  {
    name: "Gleap",
    verdict:
      "Chat, chatbot, and ticketing on the same bill. Hobby covers a single seat.",
    bestFor: "SaaS products combining in-app support and feedback",
    startingPrice: prices.gleap,
    selfHosted: { type: "no" },
    href: "/vs/gleap" as Route,
  },
  {
    name: "Ruttl",
    verdict:
      "Live CSS edits instead of descriptions. Charged per user, cloud only.",
    bestFor: "Designers reviewing live web pages with on-page annotations",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
    href: "/vs/ruttl" as Route,
  },
  {
    name: "Markup.io",
    verdict: "Flat rate, unlimited users. No free plan since January 2025.",
    bestFor: "Design review across PDFs, images, and live URLs",
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
  {
    name: "Feedbucket",
    verdict: "Cheapest entry in the list. No self-hosting, no MCP server.",
    bestFor: "Small agencies wanting a simple hosted widget",
    startingPrice: prices.feedbucket,
    selfHosted: { type: "no" },
  },
];

export function UsersnapAlternativesSection() {
  return (
    <VsSection
      eyebrow="Alternatives"
      title="Usersnap alternatives compared"
      intro="The verdict sits under each tool name. Pricing is each vendor's monthly rate, with the annual rate in parentheses."
      tone="muted"
    >
      <VsAlternativesTable
        alternatives={alternatives}
        closingNote={ALTERNATIVES_CLOSING_NOTE}
      />
    </VsSection>
  );
}
