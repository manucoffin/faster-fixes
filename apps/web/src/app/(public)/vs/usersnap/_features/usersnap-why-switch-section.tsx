const limitations = [
  {
    title: "Pricing scales with headcount",
    body: "Usersnap is tiered by seat count: Starter $49/mo (5 seats), Growth $109/mo (10 seats), Professional $199/mo (20 seats), Premium from $319/mo (50 seats). Hire one more person at the wrong moment and your bill jumps to the next tier. FasterFixes charges a flat $20/mo for Pro (up to 5 members) and $99/mo for Agency with unlimited members. Headcount stops being a pricing variable.",
  },
  {
    title: "No self-hosting option",
    body: "Usersnap is SaaS-only: no self-hosted option, no public source code, no path to running it on your own infrastructure. FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3. Your feedback data stays on your servers.",
  },
  {
    title: "Not built for developers",
    body: "Usersnap is designed for PMs and CX teams. It captures screenshots, but it does not know which React component was clicked, which DOM selector is involved, or what the viewport was. FasterFixes captures DOM selector, URL, browser, and viewport automatically on every feedback item, plus the component tree on React sites, no manual annotation required.",
  },
  {
    title: "No MCP or AI agent support",
    body: "Usersnap has no MCP integration. FasterFixes ships @fasterfixes/mcp, a Model Context Protocol server that lets Claude Code, Cursor, and Codex pull feedback items directly from the terminal or IDE. Your coding agent can read, act on, and resolve feedback without leaving the editor.",
  },
];

export function UsersnapWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Where Usersnap falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Usersnap
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {limitations.map((item) => (
            <div key={item.title} className="rounded-xl border bg-muted/30 p-7">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
