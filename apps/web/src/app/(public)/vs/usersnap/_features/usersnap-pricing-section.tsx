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
    vendor: "Usersnap · Company",
    plan: "Cloud-only, closed source",
    price: "~$249",
    suffix: "/ month",
    note: "Per-seat pricing model. Includes NPS, microsurveys, feature boards, Jira/Slack/GitHub integrations, and custom branding. Startup plan starts at ~$69/mo.",
  },
];

export function UsersnapPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Usersnap pricing vs FasterFixes: what you actually pay
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            FasterFixes is open source. The lowest plan in any honest
            comparison is &quot;free, forever, on your own server.&quot; If you
            would rather not run it yourself, the hosted plans are flat-rate —
            not per-seat. Usersnap uses per-seat tier pricing where the Startup
            plan starts at ~$69/month and the Company plan at ~$249/month.
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

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border p-7">
          <p className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Worked example
          </p>
          <p className="mt-2 text-lg font-semibold">
            5-person dev agency, 3 active client projects
          </p>
          <ul className="text-muted-foreground mt-4 space-y-2 text-sm leading-relaxed">
            <li>
              <span className="text-foreground font-medium">
                Usersnap Company:
              </span>{" "}
              ~$249/mo × 12 = ~$2,988/year
            </li>
            <li>
              <span className="text-foreground font-medium">
                FasterFixes Agency:
              </span>{" "}
              $99/mo × 12 = $1,188/year
            </li>
            <li>
              <span className="text-foreground font-medium">
                FasterFixes self-hosted:
              </span>{" "}
              $0/year (infrastructure costs only)
            </li>
          </ul>
          <p className="mt-4 text-sm">
            Annual savings: <strong>$1,800 to $2,988</strong> depending on
            deployment.
          </p>
        </div>

        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm">
          Usersnap pricing is based on publicly available information and may
          change. Check their site for current rates.
        </p>
      </div>
    </section>
  );
}
