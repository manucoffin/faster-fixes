const pillars = [
  {
    title: "Open source, not a black box",
    body: "The dashboard, the widget, and the MCP server are on GitHub under AGPL. Read the code, audit the behaviour, fork it the day its roadmap stops matching yours.",
  },
  {
    title: "One less SaaS to depend on",
    body: "Agencies and freelancers already rely on a stack of vendors. FasterFixes is a tool you own outright — deploy it on the infrastructure you already pay for, not another per-seat bill.",
  },
  {
    title: "Portable at project hand-off",
    body: "Agencies close projects, freelancers rotate clients. Your feedback lives in your Postgres. Hand off the full stack to the client, or migrate it, without a vendor in the loop.",
  },
];

export function WhyOpenSourceSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Why open source
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Built to be inspected, forked, and self-hosted
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-muted/30 rounded-xl border p-7"
            >
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
