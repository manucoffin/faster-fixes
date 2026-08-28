import { GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function MarkerIoHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            Marker.io alternative
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            The open-source alternative to Marker.io
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            FasterFixes is an open-source, self-hostable alternative to
            Marker.io, licensed AGPL-3.0 and priced flat rather than per seat.
            The difference goes beyond price: an MCP server lets Claude Code,
            Cursor, and Codex fetch and fix client feedback from the terminal,
            with every report carrying a screenshot, DOM selector, React
            component tree, console logs, and network requests. Marker.io is
            closed-source and cloud-only.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Start for free
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
                View source on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
