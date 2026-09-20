const cards = [
  {
    title: "Screenshot + annotated coordinates",
    body: "Every report ships with a screenshot of the page exactly as the client saw it, plus the annotated coordinates and visible viewport. The same baseline Markup.io captures, included on every plan, including self-hosted.",
  },
  {
    title: "CSS selector + React component path",
    body: "FasterFixes captures the React component name, props, and DOM selector at the click point. Developers receive a report that maps to the codebase, not a pixel coordinate. Markup.io stops at coordinates and a screenshot.",
  },
  {
    title: "Browser, OS, viewport context",
    body: "Every report includes the browser version, operating system, viewport dimensions, device pixel ratio, and console errors captured at submit time. No follow-up questions needed before a developer can reproduce.",
  },
  {
    title: "Structured output to GitHub, Linear, Jira, or MCP",
    body: "Each feedback item is a structured task. Sync to GitHub, Linear, or Jira Cloud with workflow-state-aware two-way updates, or expose it to Claude Code, Cursor, and Codex via the built-in MCP server. Markup.io reserves integrations for Enterprise.",
  },
];

export function MarkupIoCapabilitiesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What lands in every report
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Feedback developers can actually act on
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
