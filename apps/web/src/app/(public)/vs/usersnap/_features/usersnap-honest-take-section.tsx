export function UsersnapHonestTakeSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Usersnap is the better choice for some teams
          </h2>
        </div>

        <div className="mt-10 space-y-5 text-lg leading-relaxed">
          <p>
            This is a direct comparison, not a sales pitch. Usersnap has a
            significantly richer feature set for non-developer use cases.
            FasterFixes and Usersnap solve overlapping problems in meaningfully
            different ways.
          </p>
          <ul className="text-muted-foreground list-disc space-y-3 pl-6">
            <li>
              <strong className="text-foreground">
                NPS surveys and microsurveys
              </strong>{" "}
              — Usersnap supports NPS, CSAT, and in-app microsurveys out of the
              box. FasterFixes has no survey tooling.
            </li>
            <li>
              <strong className="text-foreground">
                Feature request boards
              </strong>{" "}
              — built-in public roadmap and voting for product teams. FasterFixes
              does not support this.
            </li>
            <li>
              <strong className="text-foreground">Browser extension</strong> —
              lets non-technical reporters submit feedback on any site without
              installing a widget. FasterFixes requires a React or Next.js widget
              today.
            </li>
            <li>
              <strong className="text-foreground">Integration breadth</strong> —
              Jira, Slack, Zendesk, Azure DevOps, and 50+ other tools. FasterFixes
              ships GitHub two-way sync; more integrations are in progress.
            </li>
            <li>
              <strong className="text-foreground">Any-stack support</strong> —
              Usersnap works on any stack. FasterFixes is React-native with a
              basic HTML embed for non-React pages.
            </li>
            <li>
              <strong className="text-foreground">Enterprise polish</strong> —
              custom branding, SSO, and dedicated account management on
              enterprise plans.
            </li>
          </ul>
          <p>
            If your workflow centers on product feedback, customer satisfaction,
            NPS tracking, or non-technical client reporting, Usersnap is the more
            complete tool today. FasterFixes is built for a narrower brief — and
            we think it is the right brief for most developer teams shipping
            client websites:
          </p>
          <ul className="text-muted-foreground list-disc space-y-3 pl-6">
            <li>
              <strong className="text-foreground">
                Self-host on your own stack
              </strong>{" "}
              — full deployment on Next.js, Postgres, Inngest, R2/S3. Usersnap
              has no self-hosted option.
            </li>
            <li>
              <strong className="text-foreground">
                Open-source under AGPL-3.0
              </strong>{" "}
              — the widget packages are MIT. Audit, fork, or modify the code.
            </li>
            <li>
              <strong className="text-foreground">
                Bring your own AI agent via MCP
              </strong>{" "}
              — Claude Code, Cursor, Codex, or any MCP-compatible client. You
              pick the model.
            </li>
            <li>
              <strong className="text-foreground">
                React component tree capture
              </strong>{" "}
              — every report ships with the DOM selector and the React component
              path. The agent knows which file owns the bug.
            </li>
            <li>
              <strong className="text-foreground">Flat pricing</strong> —
              $20/month for a 5-person team versus ~$69/month on Usersnap Startup.
              The free plan covers 1 project, 50 feedback items, and 1 member at
              no cost.
            </li>
          </ul>
          <p>
            FasterFixes is a younger product. It does not match Usersnap&apos;s
            survey tooling, integration breadth, or enterprise features. What it
            offers instead is full code ownership, a self-hosted deployment
            path, and a developer workflow no closed-source SaaS can replicate.
          </p>
        </div>
      </div>
    </section>
  );
}
