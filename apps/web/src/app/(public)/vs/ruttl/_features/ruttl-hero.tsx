import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function RuttlHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            Ruttl alternative
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            The open-source Ruttl alternative built for developer teams
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Ruttl charges $18 per user per month — a five-person team pays
            $1,080 a year. FasterFixes is flat-rate: $20 a month hosted for up
            to five members, or free if you self-host, with no per-seat math at
            any scale. AGPL-3.0 licensed, with an MCP server so Claude Code and
            Cursor can fix feedback from the terminal.
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
