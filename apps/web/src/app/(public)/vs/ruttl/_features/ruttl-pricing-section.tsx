const rows = [
  {
    label: "Ruttl Pro (5 people)",
    value: "$90/mo = $1,080/year",
  },
  {
    label: "Ruttl Business (5 people)",
    value: "$450/mo = $5,400/year",
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

export function RuttlPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Free if you self-host. Flat rate if you don&apos;t.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Ruttl Pro is $18 per user per month with a 2-seat minimum. Every new
            teammate adds $18. FasterFixes is flat: one price for up to 5
            members, or $0 if you self-host.
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
          A 5-person team saves $840/year switching from Ruttl Pro to
          FasterFixes Pro. Self-hosting saves the full $1,080.
        </p>
      </div>
    </section>
  );
}
