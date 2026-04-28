export const migrationSteps = [
  {
    label: "Export your feedback data from Usersnap",
    body: "Use Usersnap's CSV export or REST API to download your existing feedback items. Keep a local copy before deactivating your account. Note: NPS and survey responses do not have an equivalent in FasterFixes and will not carry over.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Choose self-hosted (Next.js, Postgres, Inngest, R2/S3) or sign up for the hosted Pro plan. The self-hosted path takes roughly 30 minutes with the provided setup docs. No account required for clients submitting feedback.",
  },
  {
    label: "Replace the Usersnap widget",
    body: "Remove the Usersnap script from your codebase. Install the FasterFixes React widget (npm install @fasterfixes/react) and drop the component into your layout, or use the HTML embed for non-React pages. Generate a shareable link for each client — no client account required.",
  },
  {
    label: "Invite your team and connect GitHub",
    body: "Add team members from the dashboard and connect your GitHub repository for two-way issue sync. Configure @fasterfixes/mcp in your IDE or terminal to give your coding agent direct access to incoming feedback.",
  },
];

export function UsersnapMigrationSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from Usersnap
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            No one-click import. Export your data, replace the widget, and wire
            up the integrations — the whole process takes under an hour.
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
