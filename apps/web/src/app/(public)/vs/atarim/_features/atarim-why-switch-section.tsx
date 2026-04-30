const limitations = [
  {
    title: "Per-seat pricing scales against you",
    body: "Atarim Pro costs $25/seat/month billed yearly. A 5-person team pays $125/month, or $1,500/year. FasterFixes Pro is $20/month flat for up to 5 members — $240/year. That is a $1,260/year difference for the same team size, before you hit Atarim's 5-seat cap and need to upgrade to Business at $35/seat/month. Per-seat models also create friction when onboarding contractors or reviewers who only need temporary access.",
  },
  {
    title: "Cloud-only with no self-hosting option",
    body: "Atarim has no self-hosting path. All feedback, screenshots, and client communications are stored on Atarim's infrastructure. For teams handling sensitive client projects or operating under data residency requirements, there is no way to keep that data in your own environment. FasterFixes deploys on your own Next.js, Postgres, Inngest, and R2/S3 stack — client feedback never leaves your infrastructure.",
  },
  {
    title: "Built for agency client review, not dev workflows",
    body: "Atarim is framework-agnostic by design: it works via a JS snippet, a Chrome extension, or a WordPress plugin. There is no React or Next.js SDK, no component tree capture, and no DOM selector attached to feedback items. When a client clicks on a broken element, the report contains a screenshot and a URL — not the React component path, not the CSS selector, not the browser/viewport metadata a developer needs to locate the issue in code.",
  },
  {
    title: "AI stays inside the dashboard — no IDE or terminal access",
    body: "Atarim's InnerCircle agents (Pixel, Claro, Lexi, Index, Navi, Glitch) run inside the Atarim dashboard and generate analysis there. There is no MCP server, no Claude Code integration, no Cursor or Codex support. An AI coding agent cannot read an Atarim feedback item from the terminal. FasterFixes ships @fasterfixes/mcp — a Model Context Protocol server that lets AI agents fetch feedback, locate the relevant code, and apply fixes without leaving the editor.",
  },
];

export function AtarimWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Where Atarim falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Atarim
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
