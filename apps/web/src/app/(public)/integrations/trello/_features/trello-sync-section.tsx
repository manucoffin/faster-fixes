import { BotIcon, RepeatIcon } from "lucide-react";
import { SectionBody } from "../../../features/_components/section-body";
import { SectionHeading } from "../../../features/_components/section-heading";
import { TrelloSyncAnimation } from "../_components/trello-sync-animation.client";

const syncDirections = [
  {
    title: "From Faster Fixes to Trello",
    rows: [
      {
        action: "Feedback set to new",
        result: "The card moves to your New list.",
      },
      {
        action: "Feedback set to in progress",
        result:
          "The card moves to your In progress list, or stays put if you mapped none.",
      },
      {
        action: "Feedback resolved",
        result: "The card moves to your Resolved list and is marked complete.",
      },
      {
        action: "Feedback archived",
        result: "The card is archived.",
      },
    ],
  },
  {
    title: "From Trello to Faster Fixes",
    rows: [
      {
        action: "Card moved into a mapped list",
        result: "The feedback takes that list's status.",
      },
      {
        action: "Card moved into an unmapped list, such as QA",
        result: "Nothing changes.",
      },
      {
        action: "Card archived from the Resolved list",
        result:
          "The feedback stays resolved, so tidying the board rewrites nothing.",
      },
      {
        action: "Card renamed, edited or commented on",
        result: "Nothing changes. Annotate freely.",
      },
    ],
  },
];

export function TrelloSyncSection() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-2 lg:gap-16">
          <SectionHeading>
            Two-way status sync between Trello lists and Faster Fixes
          </SectionHeading>
          <SectionBody>
            <p>
              Trello has no statuses, so you choose which list stands for new,
              in progress and resolved.{" "}
              <span className="text-foreground">
                Drag a card and the feedback follows. Change the status and the
                card moves.
              </span>{" "}
              Many feedback tools only mark the feedback resolved when the card
              is done.
            </p>
          </SectionBody>
        </div>

        <TrelloSyncAnimation className="mt-12 aspect-[4/3] md:aspect-[21/9]" />

        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          {syncDirections.map((direction) => (
            <div key={direction.title}>
              <h3 className="text-xl font-medium tracking-tight">
                {direction.title}
              </h3>
              <dl className="mt-6 flex flex-col border-t">
                {direction.rows.map((row) => (
                  <div
                    key={row.action}
                    className="grid grid-cols-1 gap-1 border-b py-4 sm:grid-cols-[2fr_3fr] sm:gap-6"
                  >
                    <dt className="font-medium">{row.action}</dt>
                    <dd className="leading-relaxed text-muted-foreground">
                      {row.result}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <div className="flex gap-4">
            <RepeatIcon
              aria-hidden
              className="mt-1.5 size-5 shrink-0 text-muted-foreground"
            />
            <SectionBody>
              <p>
                <span className="text-foreground">
                  A change that came from Trello is never written back to
                  Trello,
                </span>{" "}
                so the two sides never loop.
              </p>
            </SectionBody>
          </div>

          <div className="flex gap-4">
            <BotIcon
              aria-hidden
              className="mt-1.5 size-5 shrink-0 text-muted-foreground"
            />
            <SectionBody>
              <p>
                <span className="text-foreground">
                  Feedback resolved by your coding agent
                </span>{" "}
                moves the card like any other change.
              </p>
            </SectionBody>
          </div>
        </div>
      </div>
    </section>
  );
}
