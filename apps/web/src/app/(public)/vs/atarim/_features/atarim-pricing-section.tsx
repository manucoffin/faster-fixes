import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

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
    plan: "Pro plan, up to 5 members",
    price: "$20",
    suffix: "/ month",
    note: "Flat rate. Agency tier unlocks unlimited members at $99/month. No per-seat charges as your team grows.",
  },
  {
    vendor: "Atarim · Pro",
    plan: "Cloud-only, closed source",
    price: "$67",
    suffix: "/ month, up to 100 seats",
    note: "$53.60/month billed yearly ($643.20/year). Includes 1,000 projects, 5,000 AI credits a month, and your brand on the client dashboard. Extra credits cost $6 to $10 per 1,000. Enterprise adds SSO, SAML, and an SLA at custom pricing.",
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
            Atarim sells one paid plan: Pro at $67/month, or $643.20/year billed
            yearly, for up to 100 seats, with AI credits included and more sold
            in packs. FasterFixes Pro is $20/month flat for up to 5 members,
            totaling $240/year: $403.20/year less than Atarim billed yearly.
            Larger teams move to FasterFixes Agency at $99/month for unlimited
            members, which costs more than Atarim Pro. If you self-host
            FasterFixes, the cost is $0 forever.
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
