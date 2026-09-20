const cards = [
  {
    title: "The 172% price shock",
    body: "In January 2025 Markup.io raised Pro from $29 to $79 per month and eliminated the free plan entirely. Long-time customers reported a 280% increase on existing accounts and threats of data deletion for non-payment. FasterFixes is $20/mo flat, or $0 if you self-host.",
  },
  {
    title: "No integrations unless you pay Enterprise",
    body: "Jira, Linear, GitHub, Asana, and ClickUp are gated behind Enterprise pricing on Markup.io. The Pro plan ships feedback to a comments tab, not to your tracker. FasterFixes includes GitHub, Linear, and Jira sync from the $20/mo plan.",
  },
  {
    title: "Chrome extension dependency",
    body: "Markup.io needs a Chrome extension to review auth-gated, localhost, or staging URLs. That blocks mobile review entirely on those projects. FasterFixes runs as an in-page widget on every device the page already supports, no extension, no browser lock-in.",
  },
  {
    title: "Feedback lands as a comment, not a developer task",
    body: "Markup.io captures coordinates and a screenshot. Developers still need to chase down which component, which selector, which file. FasterFixes captures the React component path, CSS selector, browser context, and ships a structured task ready for an issue tracker or an AI coding agent.",
  },
];

export function MarkupIoWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Why switch
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams are leaving Markup.io
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-xl border bg-muted/30 p-7">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
