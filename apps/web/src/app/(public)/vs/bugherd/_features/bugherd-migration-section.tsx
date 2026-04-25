export const migrationSteps = [
  {
    label: "Export your BugHerd data",
    body: "BugHerd supports exports as CSV, XML, and JSON from any plan. Pull tasks and feedback history from Project Settings before you close the account.",
  },
  {
    label: "Set up FasterFixes in under two minutes",
    body: "Run npm install @fasterfixes/react, drop the component into your layout, and generate a shareable link for each client. No account required for clients. Connect @fasterfixes/mcp to your coding agent if you use Claude Code, Cursor, or Codex.",
  },
  {
    label: "Recreate active feedback",
    body: "For now, this step is manual — use the BugHerd export as a reference and recreate active items in FasterFixes. Coming soon: a create_feedback MCP tool will let your AI agent read the export and backfill the dashboard for you. The roadmap is public.",
  },
  {
    label: "Know what you give up",
    body: "BugHerd has features FasterFixes does not currently offer: video feedback, feedback on Figma designs / PDFs / images, a client-facing kanban (Premium), and 20+ project-management integrations (Jira, Asana, ClickUp, Monday.com, Linear, ...). If those are core to your workflow, weigh them before switching.",
  },
];

export function BugherdMigrationSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from BugHerd
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            No one-click import button. Still a short, scripted process —
            especially if you let your AI agent do the busywork.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6">
          {migrationSteps.map((step, i) => (
            <li
              key={step.label}
              className="bg-background flex gap-4 rounded-xl border p-6"
            >
              <span className="text-muted-foreground font-mono text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
