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
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Two-way sync
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Two-way status sync between Trello lists and Faster Fixes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Trello has no statuses, so you choose which list stands for new, in
            progress and resolved. Drag a card and the feedback follows. Change
            the status and the card moves. Many feedback tools only mark the
            feedback resolved when the card is done.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {syncDirections.map((direction) => (
            <div
              key={direction.title}
              className="rounded-xl border bg-background p-6"
            >
              <h3 className="font-semibold">{direction.title}</h3>
              <dl className="mt-4 divide-y">
                {direction.rows.map((row) => (
                  <div key={row.action} className="py-3">
                    <dt className="font-medium">{row.action}</dt>
                    <dd className="mt-1 leading-relaxed text-muted-foreground">
                      {row.result}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground">
          A change that came from Trello is never written back to Trello, so the
          two sides never loop. Feedback resolved by your coding agent moves the
          card like any other change.
        </p>
      </div>
    </section>
  );
}
