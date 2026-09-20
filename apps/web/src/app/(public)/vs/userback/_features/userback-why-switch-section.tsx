const limitations = [
  {
    title: "Per-seat pricing compounds",
    body: "Userback charges per seat across every tier. The Business plan, the closest equivalent to FasterFixes, runs $19/seat/month, so a 5-person team pays $95/month, or $1,140/year. FasterFixes Pro is $20/month flat for up to 5 members. Headcount stops being a pricing variable.",
  },
  {
    title: "Cloud-only, no data sovereignty",
    body: "Userback is cloud-only and closed source. There is no self-hosting option and no way to inspect the codebase. FasterFixes runs on your own infrastructure: Next.js, Postgres, Inngest, and R2/S3. Deploy on Vercel, Railway, or any Node host. Client feedback never leaves your environment.",
  },
  {
    title: "Not built for developer workflows",
    body: "Userback captures screenshots, video, and session replay, useful for product managers and end-user feedback. FasterFixes captures React component tree, DOM selector, URL, browser, and viewport automatically. Every feedback item arrives with the structured technical context a developer needs to act immediately.",
  },
  {
    title: "Built for product teams, not dev agencies",
    body: "Userback ships a feature portal, NPS/CSAT/CES surveys, user segmentation, and a public roadmap. These are powerful for SaaS product teams collecting end-user feedback at scale. If you are a dev agency delivering client projects, you are paying for a feature set you will not use, and per-seat pricing that grows with every new team member.",
  },
];

export function UserbackWhySwitchSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Where Userback falls short
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Why teams switch from Userback
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
