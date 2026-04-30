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
    price: "$125",
    suffix: "/ month for 5 seats",
    note: "Per-seat pricing: $25/seat/month billed yearly, $29/seat/month billed monthly. Plan caps at 5 seats; teams larger than 5 move to Business at $35/seat/month yearly ($42 monthly, up to 100 seats). Whitelabel is Enterprise-only.",
  },
];

export function AtarimPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Atarim pricing vs FasterFixes: what you actually pay
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Atarim uses per-seat pricing. On the Pro plan (billed yearly),
            that is $25/seat/month. A 5-person team pays $125/month —
            $1,500/year — and hits the 5-seat cap. FasterFixes Pro is $20/month
            flat for up to 5 members, totaling $240/year. The difference:
            $1,260/year saved, with no seat cap to manage. If you self-host
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
              <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                {card.vendor}
              </p>
              <p className="mt-2 text-sm">{card.plan}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{card.price}</span>
                {card.suffix && (
                  <span className="text-muted-foreground text-sm">
                    {card.suffix}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
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

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          Atarim pricing is based on publicly available information and may
          change. Check atarim.io/pricing for current rates.
        </p>
      </div>
    </section>
  );
}
