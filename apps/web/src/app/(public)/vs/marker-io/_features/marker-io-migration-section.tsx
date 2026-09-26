export const migrationSteps = [
  {
    label: "Export your Marker.io data",
    body: "Download your existing feedback as CSV from the Marker.io dashboard before you cancel the subscription. Keep the export as a reference for active items.",
  },
  {
    label: "Set up FasterFixes in under five minutes",
    body: "Start on the hosted free plan or follow the self-hosting guide to deploy on your own infrastructure. Paste the script tag on your site, or wrap your React app in FeedbackProvider from @fasterfixes/react, then generate a shareable link for each client. No account required for clients.",
  },
  {
    label: "Import active feedback via the MCP",
    body: "Connect @fasterfixes/mcp to your AI agent and point it at the Marker.io CSV. The agent parses the file and calls the create_feedbacks tool to bulk-import items, up to 100 per call, with original timestamps preserved and attributed to a named reviewer. The import skips integration fan-out, so migrated items do not open issues in GitHub, Linear, or Jira.",
  },
  {
    label: "Know what you give up",
    body: "Marker.io has features FasterFixes does not currently offer: session replay, video feedback, feedback on Figma / PDFs / images, browser extensions, Asana / ClickUp / Trello sync, a client-facing Guest Portal, and SSO. If those are core to your workflow, weigh them before switching.",
  },
];

export function MarkerIoMigrationSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from Marker.io
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No one-click import button. Hand your AI agent the existing export
            and the MCP backfills the dashboard for you.
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
