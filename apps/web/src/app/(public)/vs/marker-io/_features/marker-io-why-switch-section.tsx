const limitations = [
  {
    title: "The bill grows every time you hire",
    body: "Marker.io charges per seat — Starter covers 3 members, Team covers 15, and every additional member is $4–$6/month on top. A 5-person dev team that needs Jira and devtools already starts at $149/month annual before adding anyone. FasterFixes charges per workspace: $20/month flat for up to 5 members, $99/month for unlimited. Headcount stops being a pricing variable.",
  },
  {
    title: "No way to self-host or own your data",
    body: "Marker.io is SaaS-only — no self-hosted option, no public source code, no path to running it on your own infrastructure. This is the most-cited complaint in FOSS communities; the top result for the keyword is a Reddit thread literally titled “Looking for a self-hosted marker.io alternative.” FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3.",
  },
  {
    title: "Key features locked behind the $149/month tier",
    body: "On Marker.io Starter ($39/month annual), you do not get Jira sync, session replay, devtools (console and network logs), or custom branding. Those require Team at $149/month annual — a 3.8× jump. FasterFixes does not gate developer-relevant features by tier: GitHub two-way sync, React component tree capture, and MCP access are available on every plan, including the free one.",
  },
  {
    title: "Built for QA reviewers, not the developer fixing the bug",
    body: "Marker.io's workflow is optimized for project managers and QA — feedback lands in a dashboard, gets triaged, and eventually reaches a developer as a ticket. There is no path from client annotation to the editor or terminal. FasterFixes routes feedback to where developers work: GitHub issues via two-way sync, or the terminal via @fasterfixes/mcp, where Claude Code, Cursor, or Codex can read the report and open a fix without leaving the editor.",
  },
];

export function MarkerIoWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Where Marker.io falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Marker.io
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {limitations.map((item) => (
            <div
              key={item.title}
              className="bg-muted/30 rounded-xl border p-7"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
