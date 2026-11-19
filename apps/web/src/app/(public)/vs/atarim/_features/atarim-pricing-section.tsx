import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import {
  formatAmount,
  formatPrice,
} from "../../../_helpers/format-competitor-price";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];
const atarimPro = COMPETITOR_PRICES.atarim.plans.pro;
const atarimProBilledYearly = formatAmount(
  atarimPro.billedYearlyAmount,
  atarimPro.currency,
);
const atarimProYearlyTotal = formatAmount(
  Math.round(atarimPro.billedYearlyAmount * 12 * 100) / 100,
  atarimPro.currency,
);
const yearlySavingOnPro = formatAmount(
  Math.round((atarimPro.billedYearlyAmount - proPrice) * 12 * 100) / 100,
  atarimPro.currency,
);
const aiCredits = COMPETITOR_PRICES.atarim.otherPrices.aiCreditsPerThousand;

const cards: {
  vendor: string;
  plan: string;
  price: string;
  suffix?: string;
  note: string;
  highlight?: boolean;
}[] = [
  {
    vendor: "FasterFixes · Self-hosted",
    plan: "Open source under AGPL-3.0",
    price: "$0",
    suffix: "/ month, forever",
    note: "Clone the repo, deploy on infrastructure you already pay for, and you owe us nothing. Same product as the hosted version.",
    highlight: true,
  },
  {
    vendor: "FasterFixes · Hosted",
    plan: `Pro plan, up to ${proPlan.seats} members`,
    price: `$${proPrice}`,
    suffix: "/ month",
    note: `Flat rate. Agency tier unlocks unlimited members at $${agencyPrice}/month. No per-seat charges as your team grows.`,
  },
  {
    vendor: `Atarim · ${atarimPro.name}`,
    plan: "Cloud-only, closed source",
    price: formatPrice(atarimPro),
    suffix: `/ month, up to ${atarimPro.seats} seats`,
    note: `${atarimProBilledYearly}/month billed yearly (${atarimProYearlyTotal}/year). Includes ${atarimPro.projects.toLocaleString("en-US")} projects, 5,000 AI credits a month, and your brand on the client dashboard. Extra credits cost ${formatAmount(aiCredits.amount, aiCredits.currency)} to ${formatAmount(aiCredits.maxAmount, aiCredits.currency)} per 1,000. Enterprise adds SSO, SAML, and an SLA at custom pricing.`,
  },
];

export function AtarimPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Atarim pricing vs FasterFixes: what you actually pay
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Atarim sells one paid plan: {atarimPro.name} at{" "}
            {formatPrice(atarimPro)}/month, or {atarimProYearlyTotal}/year
            billed yearly, for up to {atarimPro.seats} seats, with AI credits
            included and more sold in packs. FasterFixes Pro is ${proPrice}
            /month flat for up to {proPlan.seats} members, totaling $
            {proPrice * 12}/year:
            {yearlySavingOnPro}/year less than Atarim billed yearly. Larger
            teams move to FasterFixes Agency at ${agencyPrice}/month for
            unlimited members, which costs more than Atarim Pro. If you
            self-host FasterFixes, the cost is $0 forever.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.vendor}
              className={`rounded-xl border p-7 ${
                card.highlight ? "border-foreground bg-muted/30" : ""
              }`}
            >
              <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                {card.vendor}
              </p>
              <p className="mt-2 text-sm">{card.plan}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{card.price}</span>
                {card.suffix && (
                  <span className="text-sm text-muted-foreground">
                    {card.suffix}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {card.note}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={signupUrl}>
              Start hosted, free
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="size-5" />
              Self-host from GitHub
            </a>
          </Button>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Atarim pricing is based on publicly available information and may
          change. Check atarim.io/pricing for current rates.
        </p>
      </div>
    </section>
  );
}
