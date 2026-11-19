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
import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  EXCHANGE_RATE_NOTE,
  formatPrice,
  formatPublishedPrice,
} from "../../../_helpers/format-competitor-price";

const { bugherd, usersnap, markupIo } = COMPETITOR_PRICES;
const bugherdStandard = formatPrice(bugherd.plans.standard);
const bugherdExtraSeat = formatPrice(bugherd.otherPrices.extraSeat);
const usersnapGrowth = formatPublishedPrice(usersnap.plans.growth, "/mo");
const markupIoPro = formatPrice(markupIo.plans.pro);

const alternatives: VsAlternative[] = [
  {
    name: "FasterFixes",
    verdict: `Self-hosted for $0, flat-rate when hosted. MCP server, DOM selector, React component tree.`,
    startingPrice: prices.fasterFixes,
    selfHosted: { type: "yes", note: SELF_HOSTED_NOTE },
    highlight: true,
  },
  {
    name: "BugHerd",
    verdict: `Unlimited client guests. ${bugherdStandard}/mo for ${bugherd.plans.standard.seats} members plus ${bugherdExtraSeat}/seat after that.`,
    startingPrice: prices.bugherd,
    selfHosted: { type: "no" },
    href: "/vs/bugherd" as Route,
  },
  {
    name: "Marker.io",
    verdict: "Reporters are free, internal seats are not. Starter caps at 3.",
    startingPrice: prices.markerIo,
    selfHosted: { type: "no" },
    href: "/vs/marker-io" as Route,
  },
  {
    name: "Usersnap",
    verdict: `Two seats on Starter, so a team of three moves to Growth at ${usersnapGrowth}.`,
    startingPrice: prices.usersnap,
    selfHosted: { type: "no" },
    href: "/vs/usersnap" as Route,
  },
  {
    name: "Userback",
    verdict:
      "A free plan that drops feedback after 7 days. Replay starts on Business.",
    startingPrice: prices.userback,
    selfHosted: { type: "no" },
    href: "/vs/userback" as Route,
  },
  {
    name: "Atarim",
    verdict:
      "One price for up to 100 seats. WordPress plugin and Chrome extension included.",
    startingPrice: prices.atarim,
    selfHosted: { type: "no" },
    href: "/vs/atarim" as Route,
  },
  {
    name: "Ruttl",
    verdict:
      "Live CSS edits and side-by-side review. Per user, cloud only, link-back integrations.",
    startingPrice: prices.ruttl,
    selfHosted: { type: "no" },
  },
  {
    name: "Markup.io",
    verdict: `Flat ${markupIoPro}/mo for unlimited users. No free plan since January 2025.`,
    startingPrice: prices.markupIo,
    selfHosted: { type: "no" },
    href: "/vs/markup-io" as Route,
  },
];

export function RuttlAlternativesSection() {
  return (
    <VsAlternativesSection
      title="Ruttl alternatives compared"
      intro="Pricing is each vendor's monthly rate, with the annual rate in parentheses. Self-hosted means you can run the product on infrastructure you control."
      alternatives={alternatives}
      closingNote={`${ALTERNATIVES_CLOSING_NOTE} ${EXCHANGE_RATE_NOTE}`}
    />
  );
}
