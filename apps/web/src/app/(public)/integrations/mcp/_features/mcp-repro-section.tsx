const reproFields = [
  {
    label: "Page URL",
    body: "The exact URL the client was on when they submitted the report.",
  },
  {
    label: "DOM selector",
    body: "A CSS selector pointing at the element the feedback is attached to.",
  },
  {
    label: "Click position",
    body: "The x / y coordinates of the click, plus the viewport size at submission.",
  },
  {
    label: "Browser and OS",
    body: "Browser name and version and the operating system the client was using.",
  },
  {
    label: "Screenshot",
    body: "A screenshot captured at submission, returned as a URL the agent can open.",
  },
  {
    label: "Console logs",
    body: "Console output captured in the browser right before the report was sent.",
  },
  {
    label: "Network requests",
    body: "Network activity from just before submission: the failing call is usually right there.",
  },
  {
    label: "Status",
    body: "Where the item is in its lifecycle: new, in progress, resolved, or closed.",
  },
];

export function McpReproSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What the agent receives
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            A repro bundle, not a text comment
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            When the agent calls <code>list_feedbacks</code>, each item arrives
            as structured context it can act on directly, so it doesn&apos;t
            have to ask the client to reproduce anything.
          </p>
        </div>

        <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {reproFields.map((field) => (
            <div
              key={field.label}
              className="rounded-xl border bg-muted/30 p-6"
            >
              <dt className="font-semibold">{field.label}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">
                {field.body}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
          The agent can filter by <code>status</code> and <code>page_url</code>{" "}
          to scope its work to a single page or a sprint.
        </p>
      </div>
    </section>
  );
}
