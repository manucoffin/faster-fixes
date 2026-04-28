const limitations = [
  {
    title: "Per-seat pricing adds up fast",
    body: "Usersnap's Startup plan starts at ~$69/mo for up to 15 seats. As your team grows, costs scale with headcount. FasterFixes charges a flat $20/mo for the Pro plan (up to 5 members) and $99/mo for Agency with unlimited members. Headcount stops being a pricing variable.",
  },
  {
    title: "No self-hosting option",
    body: "Usersnap is SaaS-only — no self-hosted option, no public source code, no path to running it on your own infrastructure. FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3. Your feedback data stays on your servers.",
  },
  {
    title: "Not built for developers",
    body: "Usersnap is designed for PMs and CX teams. It captures screenshots, but it does not know which React component was clicked, which DOM selector is involved, or what the viewport was. FasterFixes captures component tree, DOM selector, URL, browser, and viewport automatically on every feedback item — no manual annotation required.",
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
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Where Usersnap falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Usersnap
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
