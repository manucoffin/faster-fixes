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
    vendor: "Userback · Business",
    plan: "Cloud-only, closed source",
    price: "$119",
    suffix: "/ month for up to 15 seats",
    note: "$89/month billed annually. Extra seats are $9/month each ($7 billed annually). Includes session replay, console and network capture, AI Feedback & Insights, surveys, and the Feature Portal. The Team plan is $49/month for 5 seats without these features.",
  },
];

export function UserbackPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Userback pricing vs FasterFixes: what you actually pay
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            FasterFixes is open source. The lowest plan in any honest comparison
            is &quot;free, forever, on your own server.&quot; If you would
            rather not run it yourself, the hosted plans are flat-rate, not
            tiered by team size. Userback sells plans with a fixed number of
            seats: Team $49/month for 5, Business $119/month for 15, Business
            Plus $199/month for 25 (monthly billing), with extra seats at
            $9/month on Business and above. The Business plan is the closest
            equivalent to FasterFixes for structured bug reporting: $1,428/year
            on monthly billing, $1,068/year billed annually.
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
          Userback pricing is based on publicly available information and may
          change. Check their site for current rates.
        </p>
      </div>
    </section>
  );
}
