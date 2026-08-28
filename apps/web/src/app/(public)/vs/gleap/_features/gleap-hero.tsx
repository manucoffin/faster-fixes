import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function GleapHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            Gleap alternative
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            The open-source Gleap alternative built for developer teams
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Gleap has pivoted to AI customer support — chatbot, ticketing,
            shared inbox. FasterFixes is built for the opposite workflow:
            structured bug reports carrying screenshot, DOM selector, React
            component tree, console logs, and network requests, routed to
            GitHub, Linear, or Jira and readable by Claude Code or Cursor over
            MCP. Open-source under AGPL-3.0, self-hostable, and flat-rate.
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
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
