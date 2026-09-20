const cards = [
  {
    title: "MCP server",
    body: "Query open bugs from Claude Code or Cursor without leaving your terminal. FasterFixes ships with a built-in MCP (Model Context Protocol) server. Ask your AI agent about open issues and get structured answers from your feedback queue. No browser tab, no copy-pasting, no context switch.",
  },
  {
    title: "React component tree capture",
    body: 'When a client clicks on a bug, FasterFixes captures the full React component tree at that point: component name, props, state, and DOM selector. Developers receive a report that maps directly to the codebase, not a pixel coordinate. Eliminates the "which button is this?" back-and-forth entirely.',
  },
  {
    title: "Structured markdown output",
    body: "Every report is formatted as a structured markdown task: title, steps to reproduce, browser and OS metadata, component context, screenshot reference. Ready to paste into a GitHub issue, Linear task, or Jira issue, or consumed directly by an AI coding agent, without any reformatting.",
  },
  {
    title: "Self-hosting",
    body: "AGPL-3.0 dashboard, MIT widget. Deploy on Vercel, Railway, a VPS, or any infrastructure you control. Client feedback data never leaves your environment. No vendor lock-in, no exposure to pricing changes, no third-party service dependency.",
  },
];

export function GleapFeatureCardsSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What FasterFixes does differently
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Built around the editor, not the inbox
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
