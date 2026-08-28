import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function MarkupIoHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            Markup.io alternative
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            The open-source Markup.io alternative for developer teams
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Markup.io raised prices 172% in January 2025 and removed its free
            plan. FasterFixes is the open-source alternative: AGPL-3.0, self-
            hostable for free, or $20 a month flat for up to five members.
            Feedback carries a screenshot, DOM selector, React component tree,
            console logs, and network requests, and syncs to GitHub, Linear, or
            Jira.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Try FasterFixes free
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-5" />
                Self-host on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
