const cards = [
  {
    title: "Feedback flows to your AI coding agent",
    body: "FasterFixes ships with a built-in MCP server. Claude Code, Cursor, and Codex can read open feedback, ask follow-up questions, and propose patches without you ever opening the dashboard. Ruttl has no MCP server and no AI agent integration.",
  },
  {
    title: "React component tree captured automatically",
    body: "When a client annotates a bug, FasterFixes captures the React component name, props, and DOM selector at the click point. Developers receive a report that maps to the codebase, not a pixel coordinate. No reproduction steps required.",
  },
  {
    title: "No client account required",
    body: "Guests annotate directly on the page, no signup, no email confirmation, no per-seat fee for the client. The friction that kills feedback loops with non-technical stakeholders is gone.",
  },
  {
    title: "Self-host on your own stack",
    body: "AGPL-3.0 dashboard, MIT widget. Deploy on Vercel, Railway, a VPS, or any infrastructure you control. Feedback data, screenshots, and project metadata never leave your environment.",
  },
];

export function RuttlFeatureCardsSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What FasterFixes does differently
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Built for developer teams, not just review cycles
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
