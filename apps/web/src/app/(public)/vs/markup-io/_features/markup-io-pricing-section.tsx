const rows = [
  {
    label: "Markup.io Pro",
    value: "$79/mo = $948/year",
  },
  {
    label: "Markup.io Enterprise (integrations)",
    value: "Custom: quote required",
  },
  {
    label: "FasterFixes Pro (up to 5)",
    value: "$20/mo = $240/year",
    highlight: true,
  },
  {
    label: "FasterFixes self-hosted",
    value: "$0",
    highlight: true,
  },
];

export function MarkupIoPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Pricing that doesn&apos;t change on you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Markup.io raised Pro from $29 to $79 in January 2025 and removed its
            free plan. Integrations now require Enterprise. FasterFixes includes
            GitHub, Linear, and Jira sync on the $20/mo plan, and the
            self-hosted version is free.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-xl border bg-muted/30">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 border-b p-5 last:border-b-0 ${
                row.highlight ? "bg-background" : ""
              }`}
            >
              <span className="text-sm font-medium md:text-base">
                {row.label}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums md:text-base">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
          A 5-person agency saves $708/year switching from Markup.io Pro to
          FasterFixes Pro. Self-hosting saves the full $948.
        </p>
      </div>
    </section>
  );
}
