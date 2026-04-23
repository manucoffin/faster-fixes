import { APP_URL, GITHUB_REPO_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { HeroDotBackground } from "../../(home)/_features/hero/hero-dot-background.client";

export function OpenSourceHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            Open source · AGPL-3.0
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            Open-source feedback widget for developers
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Self-host the dashboard, the widget API, and the MCP server. Own
            your feedback pipeline end-to-end. No per-seat pricing, no vendor
            lock-in.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-5" />
                Star on GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={"/docs/self-hosting" as Route}>
                Read the self-hosting guide
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-6 text-sm">
            Prefer the hosted version?{" "}
            <Link
              href={signupUrl}
              className="underline-offset-4 hover:underline"
            >
              Start free on {new URL(APP_URL).host}
            </Link>
            .
          </p>
        </div>
      </section>
    </HeroDotBackground>
  );
}
