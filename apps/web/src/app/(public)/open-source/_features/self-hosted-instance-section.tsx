const capabilities = [
  {
    title: "Every plan feature, unlocked",
    body: "A self-hosted instance always resolves to the top plan. Projects, feedback and members are unlimited, and the white-label widget is included.",
  },
  {
    title: "The same integrations",
    body: "GitHub Issues, Linear and Jira mirror feedback both ways, and Slack announces new feedback. Each integration runs on app credentials you register for your instance.",
  },
  {
    title: "Agent API without hosted rate limits",
    body: "The hourly limits on the agent API apply to the hosted version only. Point the MCP server at your domain and your coding agent talks to your instance directly.",
  },
  {
    title: "Storage you choose",
    body: "Store screenshots on Cloudflare R2, AWS S3, an S3-compatible server such as MinIO, or local disk. Screenshots stay private and are only served through signed URLs.",
  },
  {
    title: "Email you choose",
    body: "Send sign-up confirmations and password resets through Resend, Plunk or your own SMTP server. Marketing contact sync is skipped when you use SMTP.",
  },
  {
    title: "No billing code",
    body: "Stripe is not required. Billing runs only on the hosted version, so a self-hosted organization never needs a subscription.",
  },
];

export function SelfHostedInstanceSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Self-hosted instance
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            What a self-hosted instance includes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Self-hosting runs the same codebase as the hosted version,
            configured through environment variables. Your feedback, reviewers
            and screenshots stay in the database and storage you control.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {capabilities.map((capability) => (
            <div
              key={capability.title}
              className="rounded-xl border bg-background p-7"
            >
              <h3 className="text-lg font-semibold">{capability.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {capability.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
