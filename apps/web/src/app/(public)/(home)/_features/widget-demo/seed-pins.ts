import type { FeedbackItem } from "@fasterfixes/core";

const TWO_DAYS_AGO = new Date(
  Date.now() - 2 * 24 * 60 * 60 * 1000,
).toISOString();
const ONE_DAY_AGO = new Date(
  Date.now() - 1 * 24 * 60 * 60 * 1000,
).toISOString();

const HERO_CTA_SELECTOR = '[data-demo-pin-target="hero-cta"]';
const HERO_INSTALL_SELECTOR = '[data-demo-pin-target="hero-install"]';

/**
 * Curated demo pins that appear on the homepage so a first-time visitor
 * can see what the widget produces without dropping their own pin first.
 *
 * `pageUrl` is overwritten at runtime by the local storage client to match
 * `window.location.href`, so seeds always show on whichever origin the
 * homepage is served from.
 */
export const SEED_PINS: FeedbackItem[] = [
  {
    id: "seed-leia",
    status: "new",
    comment:
      "The CTA contrast feels low against the gradient. Does this pass WCAG AA?",
    pageUrl: "",
    clickX: null,
    clickY: null,
    selector: HERO_CTA_SELECTOR,
    screenshotUrl: null,
    reviewer: { id: "seed-leia", name: "L. Organa" },
    createdAt: TWO_DAYS_AGO,
    metadata: null,
  },
  {
    id: "seed-han",
    status: "new",
    comment:
      "Should we say this works on any site, not only React apps? Not all visitors will know what `@fasterfixes/react` is at a glance.",
    pageUrl: "",
    clickX: null,
    clickY: null,
    selector: HERO_INSTALL_SELECTOR,
    screenshotUrl: null,
    reviewer: { id: "seed-han", name: "H. Solo" },
    createdAt: ONE_DAY_AGO,
    metadata: null,
  },
];
