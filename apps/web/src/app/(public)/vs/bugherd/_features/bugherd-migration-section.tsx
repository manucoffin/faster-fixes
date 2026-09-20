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
    label: "Import active feedback via the MCP",
    body: "Connect @fasterfixes/mcp to your AI agent and hand it the BugHerd CSV, XML, or JSON export. The agent parses the file and calls the create_feedbacks tool to bulk-import items, up to 100 per call, with original timestamps preserved and attributed to a named reviewer. The import skips integration fan-out, so migrated items do not open GitHub issues or Linear tickets.",
  },
  {
    label: "Know what you give up",
    body: "BugHerd has features FasterFixes does not currently offer: video feedback, feedback on Figma designs / PDFs / images, a client-facing kanban (Premium), and 20+ project-management integrations (Asana, ClickUp, Monday.com, Trello, ...). If those are core to your workflow, weigh them before switching.",
  },
];

export function BugherdMigrationSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from BugHerd
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No one-click import button. Still a short, scripted process,
            especially if you let your AI agent do the busywork.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6">
          {migrationSteps.map((step, i) => (
            <li
              key={step.label}
              className="flex gap-4 rounded-xl border bg-background p-6"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
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
