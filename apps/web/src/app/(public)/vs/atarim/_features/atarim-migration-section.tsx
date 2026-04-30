export const migrationSteps = [
  {
    label: "Export your feedback from Atarim",
    body: "From your Atarim dashboard, export existing tasks via CSV or by syncing to a connected PM tool (Jira, ClickUp, Asana) before switching. Capture any active project URLs, annotated screenshots, and task statuses you want to preserve. Atarim does not provide a bulk media export, so download attached screenshots manually if needed.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Choose self-hosted (Next.js, Postgres, Inngest, R2/S3-compatible storage) or sign up for the hosted Pro plan at $20/month. The self-hosted path takes roughly 30 minutes with the provided setup docs. No account required for clients submitting feedback.",
  },
  {
    label: "Replace the Atarim widget",
    body: "Run npm install @fasterfixes/react and drop the FasterFixes component into your app layout. Remove the Atarim JS snippet from your site, deactivate the WordPress plugin, or stop using the Chrome extension for new feedback. The widget captures component tree, DOM selector, URL, browser, and viewport automatically.",
  },
  {
    label: "Invite your team and connect GitHub",
    body: "Add team members from the dashboard — your plan covers the full team at a flat rate. Connect your GitHub repository for two-way issue sync. Configure @fasterfixes/mcp in your IDE or terminal to give your coding agent direct access to incoming feedback.",
  },
];

export function AtarimMigrationSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from Atarim
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            No one-click import. Export your data, replace the widget, and
            wire up the integrations — the whole process takes under a day.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
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
