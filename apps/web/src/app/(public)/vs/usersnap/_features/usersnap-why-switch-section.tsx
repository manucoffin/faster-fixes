const limitations = [
  {
    title: "Pricing scales with projects",
    body: "Usersnap is tiered by project count: Starter $59/mo (2 seats, 2 projects), Growth $159/mo (10 projects), Professional $259/mo (20 projects), Premium $549/mo (50 projects). A third team member or project moves you off Starter, and each new batch of projects moves you up a tier. FasterFixes charges a flat $20/mo for Pro (up to 5 members) and $99/mo for Agency with unlimited members and projects.",
  },
  {
    title: "No self-hosting option",
    body: "Usersnap is SaaS-only: no self-hosted option, no public source code, no path to running it on your own infrastructure. FasterFixes is open source (dashboard AGPL-3.0, widget MIT) and self-hostable on Next.js, Postgres, Inngest, and R2/S3. Your feedback data stays on your servers.",
  },
  {
    title: "Not built for developers",
    body: "Usersnap is designed for PMs and CX teams. It captures screenshots, screen recordings, and browser metadata, but it does not know which React component was clicked, which DOM selector is involved, or what the viewport was. FasterFixes captures DOM selector, URL, browser, and viewport automatically on every feedback item, plus the component tree on React sites, no manual annotation required.",
  },
  {
    title: "MCP built for product analysis, not fixes",
    body: "Usersnap's MCP server lets Claude, ChatGPT, or Cursor search feedback, summarize topics, and create opportunities, but it cannot edit existing feedback and its documentation does not mention screenshots or console data. The FasterFixes MCP server gives your coding agent each Feedback with its DOM selector, Screenshot, Recording timeline, and console and network logs, then lets it set the Status once the fix ships.",
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
