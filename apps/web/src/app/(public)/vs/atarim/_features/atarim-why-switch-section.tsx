const limitations = [
  {
    title: "Priced for AI agency work, not bug reports",
    body: "Atarim sells one paid plan, Pro, at $67/month or $643.20/year billed yearly, for up to 100 seats. The price is built around its AI agents: Pro includes 5,000 AI credits a month, and further AI work is billed in credit packs. FasterFixes Pro is $20/month flat for up to 5 members, or $240/year, which is $403.20/year less than Atarim billed yearly. Past 5 members, FasterFixes Agency is $99/month for unlimited members, more than Atarim Pro. If your team needs structured bug reports rather than AI-run site work, a small team pays less on FasterFixes and has no credit balance to watch.",
  },
  {
    title: "Cloud-only with no self-hosting option",
    body: "Atarim has no self-hosting path. All feedback, screenshots, and client communications are stored on Atarim's infrastructure. For teams handling sensitive client projects or operating under data residency requirements, there is no way to keep that data in your own environment. FasterFixes deploys on your own Next.js, Postgres, Inngest, and R2/S3 stack. Client feedback never leaves your infrastructure.",
  },
  {
    title: "Built for agency client review, not dev workflows",
    body: "Atarim works via a JS snippet, a Chrome extension, or a WordPress plugin. There is no React or Next.js SDK, no component tree capture, and no DOM selector attached to feedback items. When a client clicks on a broken element, the report contains a screenshot and a URL, not the React component path, not the CSS selector, not the browser/viewport metadata a developer needs to locate the issue in code.",
  },
  {
    title: "An MCP built for agency operations, not bug context",
    body: "Atarim's InnerCircle agents (Claro, Pixel, Lexi, Index, Navi, Glitch) work inside the Atarim platform. Its free Atarim MCP connects Claude, Codex, and other MCP clients to Atarim tasks, sites, and workflows: reading and updating tasks, running workflows, and changing WordPress sites, with some actions drawing on AI credits. FasterFixes ships @fasterfixes/mcp for Claude Code, Cursor, and Codex, scoped to fixing what a Reviewer reported: get_feedback returns the Feedback with its DOM selector, Screenshot, console and network Diagnostic Trail, and the timeline of its Recording when it has one. The agent locates the code, applies the fix, and sets the Status without leaving the editor.",
  },
];

export function AtarimWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Where Atarim falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Atarim
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
