import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon, CirclePauseIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../../features/_components/section-body";
import { SectionHeading } from "../../../features/_components/section-heading";
import { TrelloStepConnectIllustration } from "../_components/trello-step-connect-illustration";
import { TrelloStepFirstCardIllustration } from "../_components/trello-step-first-card-illustration";
import { TrelloStepMappingIllustration } from "../_components/trello-step-mapping-illustration";

export const trelloSetupSteps = [
  {
    label: "Connect Trello once",
    Illustration: TrelloStepConnectIllustration,
    body: "Authorize on Trello's own consent screen, with no token to paste. One connection serves the whole organization, and tokens are encrypted at rest.",
  },
  {
    label: "Link a board, map its lists",
    Illustration: TrelloStepMappingIllustration,
    body: "Each project links to one Trello board. Pick the lists for new, in progress (optional) and resolved, choose default labels and toggle auto-create.",
  },
  {
    label: "Feedback flows in, cards appear",
    Illustration: TrelloStepFirstCardIllustration,
    body: "Each new feedback becomes a card at the top of your New list. Linking a board creates no cards for older feedback, which you can send one by one.",
  },
];

export function TrelloHowItWorksSection() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Connect your Trello board in three steps
        </SectionHeading>

        <ol className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          {trelloSetupSteps.map((step, index) => (
            <li key={step.label} className="flex flex-col gap-6">
              <step.Illustration className="aspect-[4/3] p-5 sm:p-6" />
              <div className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-sm text-foreground"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-medium">{step.label}</h3>
                  <SectionBody className="mt-2 text-base">
                    <p>{step.body}</p>
                  </SectionBody>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col gap-8 border-t pt-10 md:mt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="flex max-w-3xl gap-4">
            <CirclePauseIcon
              aria-hidden
              className="mt-1.5 size-5 shrink-0 text-muted-foreground"
            />
            <SectionBody>
              <p>
                <span className="text-foreground">Boards change.</span> When a
                mapped list is archived, the board is closed or it is no longer
                reachable, project settings tell you what to fix, and card
                creation pauses so a card never lands in the wrong place.
              </p>
            </SectionBody>
          </div>

          <Button asChild size="lg" className="self-start lg:self-center">
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
