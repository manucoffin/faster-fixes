export function BugherdHonestTakeSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            BugHerd is the better choice for some teams
          </h2>
        </div>

        <div className="mt-10 space-y-5 text-lg leading-relaxed">
          <p>
            BugHerd is a deep, mature product. It has real strengths FasterFixes
            does not match today:
          </p>
          <ul className="list-disc space-y-3 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Chrome extension</strong>:
              install once and review feedback on any client site without
              touching their code. FasterFixes needs its script tag or React
              package installed on the site.
            </li>
            <li>
              <strong className="text-foreground">
                20+ project-management integrations
              </strong>
              : Jira, Asana, ClickUp, Monday.com, Linear, Trello, Teamwork, and
              more, with deep two-way sync.
            </li>
            <li>
              <strong className="text-foreground">
                Richer feedback surface
              </strong>
              : video feedback, feedback on Figma designs, PDFs, and images.
            </li>
            <li>
              <strong className="text-foreground">Enterprise polish</strong>:
              custom branding, SSO, dedicated success manager, 99.9% uptime SLA.
            </li>
          </ul>
          <p>
            If you need that breadth, BugHerd is the better fit. FasterFixes is
            built for a narrower brief, and we think it is the right brief for
            most developer teams shipping client websites:
          </p>
          <ul className="list-disc space-y-3 pl-6 text-muted-foreground">
            <li>
              A frictionless feedback widget your clients use without an
              account.
            </li>
            <li>
              <strong className="text-foreground">
                Bring your own AI agent
              </strong>
              : the MCP server lets Claude Code, Cursor, or Codex fetch and
              resolve feedback from your editor with the model you choose.
            </li>
            <li>
              <strong className="text-foreground">One widget, any stack</strong>
              : a drop-in script tag on any site, or a React package for React
              apps. On React sites, every report also carries the component
              path.
            </li>
            <li>
              Full control of the infrastructure: self-host the dashboard, the
              API, the MCP server, and the storage.
            </li>
          </ul>
          <p>
            If that matches what you actually need, FasterFixes is faster to
            adopt and cheaper to run. If you need the breadth of BugHerd&apos;s
            project-management surface or a Chrome extension, pick BugHerd.
          </p>
        </div>
      </div>
    </section>
  );
}
