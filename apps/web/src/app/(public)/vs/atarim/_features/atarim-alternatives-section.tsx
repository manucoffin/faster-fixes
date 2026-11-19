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
      "Open source and $0 on your own server. Feedback reaches Claude Code and Cursor over MCP.",
    bestFor:
      "Dev agencies shipping sites on any stack, self-hosted with MCP and tracker sync",
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    verdict:
      "Battle-tested client review with a Kanban board. $50/mo for 5 members, then $8/seat.",
    bestFor: "Agencies collecting client feedback through sticky-note pins",
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    verdict:
      "Two-way sync with the tracker you already run. Starter stops at 3 seats.",
    bestFor: "Internal dev QA with screenshot annotation and tracker sync",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    verdict:
      "Survey and NPS tooling nobody else here has. Starter covers 2 seats and 2 projects.",
    bestFor: "SaaS product teams collecting end-user feedback and NPS",
    startingPrice: prices.usersnap,
    selfHosted: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Userback",
    verdict:
      "Fair price for a small team. Developer context starts on Business.",
    bestFor: "Product teams needing replay, NPS, and feature portals",
    startingPrice: prices.userback,
    selfHosted: { type: "no" },
    href: "/vs/userback" as Route,
  },
  {
    name: "Gleap",
    verdict: "A support platform first. No free plan, one seat on Hobby.",
    bestFor: "SaaS teams wanting bug reporting, chatbot, and ticketing in one",
    startingPrice: prices.gleap,
    selfHosted: { type: "no" },
    href: "/vs/gleap" as Route,
  },
  {
    name: "Ruttl",
    verdict:
      "Fast reviews on live pages. Its integrations link back instead of syncing data.",
    bestFor: "Designers and clients reviewing live web pages",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
    href: "/vs/ruttl" as Route,
  },
  {
    name: "Markup.io",
    verdict:
      "Best on PDFs, images, and video stills. $79/mo with no free tier left.",
    bestFor: "Design review across 30+ file types",
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
  {
    name: "Feedbucket",
    verdict: "Low-friction widget, nothing to run on your own server.",
    bestFor: "Web agencies managing client website reviews",
    startingPrice: prices.feedbucket,
    selfHosted: { type: "no" },
  },
];

export function AtarimAlternativesSection() {
  return (
    <VsAlternativesSection
      title="Atarim alternatives compared"
      intro="The verdict sits under each tool name. Pricing is each vendor's monthly rate, with the annual rate in parentheses."
      alternatives={alternatives}
      closingNote={ALTERNATIVES_CLOSING_NOTE}
    />
  );
}
