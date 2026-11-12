const rows = [
  {
    label: "Gleap Growth (5 people, monthly)",
    value: "$144/mo = $1,728/year",
  },
  {
    label: "Gleap Growth (5 people, yearly)",
    value: "$1,438/year (about $120/mo)",
  },
  {
    label: "FasterFixes Pro (up to 5)",
    value: "$20/mo = $240/year",
    highlight: true,
  },
];

export function GleapPricingSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Pricing
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">Pricing comparison</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Gleap&apos;s Hobby plan ($29/mo billed yearly, $35/mo monthly) is
            limited to 1 seat and 1 project, not viable for any real team. For 5
            people, the minimum is Growth: 4 seats included, plus 1 extra seat
            at $25/mo or $250/year.
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
          Note: Gleap AI (Kai) is not included in any plan. It is billed from a
          prepaid balance, at about $0.05 per conversation.
        </p>
      </div>
    </section>
  );
}
