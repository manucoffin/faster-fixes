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
import { EXCHANGE_RATE_NOTE } from "../../../_helpers/format-competitor-price";

const alternatives: VsAlternative[] = [
  {
    name: "FasterFixes",
    bestFor: "Dev teams wanting self-hosted, AI-ready feedback",
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    bestFor: "Agencies managing client QA visually",
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    bestFor: "Teams already using Jira, Linear, or Asana",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    bestFor: "Product teams running NPS surveys and feature boards",
    startingPrice: prices.usersnap,
    selfHosted: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Atarim",
    bestFor: "Web agencies running WordPress client review cycles",
    startingPrice: prices.atarim,
    selfHosted: { type: "no" },
    href: "/vs/atarim" as Route,
  },
  {
    name: "Gleap",
    bestFor: "SaaS products combining in-app support and feedback",
    startingPrice: prices.gleap,
    selfHosted: { type: "no" },
    href: "/vs/gleap" as Route,
  },
  {
    name: "Ruttl",
    bestFor: "Designers reviewing live web pages with on-page annotations",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
    href: "/vs/ruttl" as Route,
  },
  {
    name: "Markup.io",
    bestFor: "Design review across PDFs, images, and live URLs",
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
  {
    name: "Feedbucket",
    bestFor: "Small agencies wanting a simple hosted widget",
    startingPrice: prices.feedbucket,
    selfHosted: { type: "no" },
  },
];

export function UserbackAlternativesSection() {
  return (
    <VsAlternativesSection
      title="Best Userback alternatives in 2026"
      intro="Not every team needs the same thing. Here is how the main alternatives stack up."
      alternatives={alternatives}
      closingNote={`${ALTERNATIVES_CLOSING_NOTE} ${EXCHANGE_RATE_NOTE}`}
    />
  );
}
