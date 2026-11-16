import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

export function TrelloHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Integrations
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            Trello integration: client feedback becomes a card your team can fix
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A client writes &ldquo;the button is broken&rdquo; and nobody knows
            which page, which browser or what happened before. Faster Fixes
            turns each piece of feedback into a Trello card with the page, the
            screenshot and the logs attached, and keeps its list in sync with
            the feedback status.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={"/docs/integrations/trello" as Route}>
                Read the docs
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
