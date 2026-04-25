const limitations = [
  {
    title: "Closed source, no self-hosting",
    body: "BugHerd is proprietary SaaS. You cannot read the code, audit how feedback is stored, or run it on your own infrastructure. Client feedback lives in a vendor's database you do not control.",
  },
  {
    title: "Per-seat pricing scales with your team",
    body: "Standard is $50/month for 5 members and every extra user is $8/month. Studio jumps to $80/month for 10, Premium to $150/month for 25. The bill grows with the team, not with the value delivered.",
  },
  {
    title: "AI is bundled, not bring-your-own",
    body: "BugHerd AI (Beta) is a feature inside the dashboard. You do not pick the model and you cannot point Claude Code, Cursor, or Codex at your feedback queue. FasterFixes ships an MCP server — you choose the agent and the model.",
  },
  {
    title: "Built around QA and project management",
    body: "Most BugHerd value lives in the management surface — kanban for clients, deep integrations with Jira, Asana, ClickUp, Monday.com, Linear. Genuinely useful for QA-led teams. Overhead if your day-to-day is the codebase.",
  },
];

export function BugherdWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Where BugHerd falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from BugHerd
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {limitations.map((item) => (
            <div
              key={item.title}
              className="bg-muted/30 rounded-xl border p-7"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
