export const migrationSteps = [
  {
    label: "Export your feedback data from Userback",
    body: "Download your feedback items from Userback via Settings > Export. CSV export is available on all plans. Note: video recordings, session replays, and survey responses do not have an equivalent in FasterFixes and will not carry over.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Choose self-hosted (Next.js, Postgres, Inngest, R2/S3) or sign up for the hosted Pro plan. The self-hosted path takes roughly 30 minutes with the provided setup docs. No account required for clients submitting feedback.",
  },
  {
    label: "Replace the Userback widget",
    body: "Remove the Userback script from your codebase. Add the FasterFixes script tag to your site, or in a React app install @fasterfixes/react and wrap the app in FeedbackProvider. Generate a shareable link for each client, no client account required.",
  },
  {
    label: "Invite your team and connect your issue tracker",
    body: "Add team members from the dashboard and connect your GitHub repository, your Linear workspace, your Jira Cloud site, or any combination, for two-way issue sync. Configure @fasterfixes/mcp in your IDE or terminal to give your coding agent direct access to incoming feedback.",
  },
];

export function UserbackMigrationSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Migration
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Switching from Userback
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No one-click import. Export your data, replace the widget, and wire
            up the integrations. The whole process takes under an hour.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
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
