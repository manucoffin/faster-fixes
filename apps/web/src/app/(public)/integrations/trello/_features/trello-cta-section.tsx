import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export function TrelloCtaSection() {
  return (
    <section className="w-full bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Bring your next review round to Trello
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Included in every paid plan. Self-hosting? Register your own Trello
            OAuth client and the integration works on your instance.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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
      </div>
    </section>
  );
}
