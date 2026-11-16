import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export const trelloSetupSteps = [
  {
    label: "Connect Trello once",
    body: "Authorize on Trello's own consent screen, with no token to paste. One connection serves the whole organization, and tokens are encrypted at rest.",
  },
  {
    label: "Link a board, map its lists",
    body: "Each project links to one Trello board. Pick the lists for new, in progress (optional) and resolved, choose default labels and toggle auto-create.",
  },
  {
    label: "Feedback flows in, cards appear",
    body: "Each new feedback becomes a card at the top of your New list. Linking a board creates no cards for older feedback, which you can send one by one.",
  },
];

export function TrelloHowItWorksSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Setup
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Connect your Trello board in three steps
          </h2>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {trelloSetupSteps.map((step, i) => (
            <li
              key={step.label}
              className="flex gap-4 rounded-xl border bg-background p-6"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground">
          Boards change. When a mapped list is archived, the board is closed or
          it is no longer reachable, project settings tell you what to fix, and
          card creation pauses so a card never lands in the wrong place.
        </p>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={"/docs/integrations/trello" as Route}>
              Full setup guide
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
