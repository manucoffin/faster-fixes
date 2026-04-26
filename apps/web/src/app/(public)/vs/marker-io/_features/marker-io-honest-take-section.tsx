export function MarkerIoHonestTakeSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Marker.io is the better choice for some teams
          </h2>
        </div>

        <div className="mt-10 space-y-5 text-lg leading-relaxed">
          <p>
            This is a direct comparison, not a sales pitch. FasterFixes and
            Marker.io solve overlapping problems in meaningfully different
            ways. Marker.io is a deeper, more mature product, and it has real
            strengths FasterFixes does not match today:
          </p>
          <ul className="text-muted-foreground list-disc space-y-3 pl-6">
            <li>
              <strong className="text-foreground">
                Session replay and video feedback
              </strong>{" "}
              — bundled on the Team plan and above. FasterFixes has no video
              feedback.
            </li>
            <li>
              <strong className="text-foreground">Browser extension</strong> —
              Chrome, Firefox, and Safari extensions let reviewers leave
              feedback on any site. FasterFixes requires a React or Next.js
              widget install today.
            </li>
            <li>
              <strong className="text-foreground">
                Feedback on Figma, PDFs, and images
              </strong>{" "}
              — annotate static assets and design files. FasterFixes does not
              support this.
            </li>
            <li>
              <strong className="text-foreground">
                Project-management integration breadth
              </strong>{" "}
              — Jira, Linear, Asana, ClickUp, Trello, Monday.com, Notion,
              Basecamp, Wrike, Shortcut, and more. FasterFixes ships GitHub
              two-way sync; more integrations are in progress.
            </li>
            <li>
              <strong className="text-foreground">Guest Portal</strong> —
              dedicated client-facing communication hub. FasterFixes has a team
              kanban; a client-facing board is on the roadmap, not yet shipped.
            </li>
            <li>
              <strong className="text-foreground">
                In-dashboard AI features
              </strong>{" "}
              — AI Title Generation, AI Magic Rewrite, AI Translation (beta).
              FasterFixes has no in-dashboard AI features.
            </li>
            <li>
              <strong className="text-foreground">Enterprise polish</strong> —
              SSO/SAML, audit logs, sensitive-data masking, dedicated account
              manager on the Business plan.
            </li>
          </ul>
          <p>
            If your workflow centers on QA handoffs, client approvals,
            Jira-heavy backlogs, or design-file annotation, Marker.io is the
            more complete tool today. FasterFixes is built for a narrower
            brief — and we think it is the right brief for most developer
            teams shipping client websites:
          </p>
          <ul className="text-muted-foreground list-disc space-y-3 pl-6">
            <li>
              <strong className="text-foreground">
                Self-host on your own stack
              </strong>{" "}
              — full deployment on Next.js, Postgres, Inngest, R2/S3. Marker.io
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
              — every report ships with the DOM selector and the React
              component path. The agent knows which file owns the bug.
            </li>
            <li>
              <strong className="text-foreground">
                Flat pricing
              </strong>{" "}
              — $20/month for a 5-person team versus $149/month annual on
              Marker.io Team. The free plan covers 1 project, 50 feedback
              items, and 1 member at no cost.
            </li>
          </ul>
          <p>
            FasterFixes is a younger product. It does not match Marker.io&apos;s
            integration breadth, session replay, or client portal. What it
            offers instead is full code ownership, a self-hosted deployment
            path, and a developer workflow no closed-source QA tool can
            replicate.
          </p>
        </div>
      </div>
    </section>
  );
}
