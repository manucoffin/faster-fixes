import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function GithubHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="text-muted-foreground mb-4 text-sm font-semibold tracking-wider uppercase">
            GitHub integration
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            Visual feedback GitHub integration that arrives ready to act on
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Every piece of client feedback becomes a fully-formed GitHub issue
            — screenshot, CSS selector, React component path, browser details,
            all included. No reproduction needed, no back-and-forth.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={"/docs/integrations/github" as Route}>
                Read the setup guide
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Start a free trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
