import type { Route } from "next";
import { COMPETITOR_PRICES } from "@/app/(public)/_helpers/competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatPrice,
} from "@/app/(public)/_helpers/format-competitor-price";
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

const bugherdStandard = COMPETITOR_PRICES.bugherd.plans.standard;
const bugherdExtraSeat = COMPETITOR_PRICES.bugherd.otherPrices.extraSeat;
const markerIoStarter = COMPETITOR_PRICES.markerIo.plans.starter;
const usersnapStarter = COMPETITOR_PRICES.usersnap.plans.starter;
const markupIoPro = COMPETITOR_PRICES.markupIo.plans.pro;

const alternatives: VsAlternative[] = [
  {
    name: "FasterFixes",
    verdict:
      "Open source and $0 on your own server. Every Feedback carries the DOM selector, console logs and network requests, readable by Claude Code and Cursor over MCP.",
    bestFor: "Dev teams fixing client sites, self-hosted or on a flat plan",
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    verdict: `Mature client review with a Kanban board. ${formatPrice(bugherdStandard)}/mo for ${bugherdStandard.seats} members, then ${formatPrice(bugherdExtraSeat)}/seat.`,
    bestFor: "Agencies collecting client feedback through sticky-note pins",
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    verdict: `The best tracker sync in the list. ${markerIoStarter.name} stops at ${markerIoStarter.seats} seats, and Jira starts on Team.`,
    bestFor: "Internal QA teams already living in Jira or Linear",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    verdict: `Surveys, NPS and a feedback portal. ${usersnapStarter.name} covers ${usersnapStarter.seats} seats and ${usersnapStarter.projects} projects.`,
    bestFor: "SaaS product teams collecting end-user feedback",
    startingPrice: prices.usersnap,
    selfHosted: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Userback",
    verdict:
      "The closest to Gleap's feedback side, without the support desk. Console logs and replay start on Business.",
    bestFor: "Product teams wanting replay, NPS and a feature portal",
    startingPrice: prices.userback,
    selfHosted: { type: "no" },
    href: "/vs/userback" as Route,
  },
  {
    name: "Atarim",
    verdict:
      "One flat plan for up to 100 seats, with AI credits billed on top.",
    bestFor: "Web agencies running WordPress client review cycles",
    startingPrice: prices.atarim,
    selfHosted: { type: "no" },
    href: "/vs/atarim" as Route,
  },
  {
    name: "Ruttl",
    verdict:
      "Live CSS edits on the page, which nobody else here does. Billed per user.",
    bestFor: "Designers and clients reviewing live web pages",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
    href: "/vs/ruttl" as Route,
  },
  {
    name: "Markup.io",
    verdict: `Best on PDFs, images and video stills. ${formatPrice(markupIoPro)}/mo with no free tier left.`,
    bestFor: "Design review across 30+ file types",
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
  {
    name: "Feedbucket",
    verdict: "The cheapest hosted widget here, with no self-hosting path.",
    bestFor: "Small agencies wanting a simple hosted widget",
    startingPrice: prices.feedbucket,
    selfHosted: { type: "no" },
  },
];

export function GleapAlternativesSection() {
  return (
    <VsSection
      eyebrow="Alternatives"
      title="Gleap alternatives compared"
      intro="Nine tools for visual bug reporting and website feedback, what each one is best at, and what it charges. Pricing is each vendor's monthly rate, with the annual rate in parentheses."
      tone="muted"
    >
      <VsAlternativesTable
        alternatives={alternatives}
        closingNote={`${ALTERNATIVES_CLOSING_NOTE} ${EXCHANGE_RATE_NOTE}`}
      />
    </VsSection>
  );
}
