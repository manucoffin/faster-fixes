const points = [
  "Your team reviews design files, PDFs, and image proofs more than live web pages: Markup.io supports 30+ file types, FasterFixes is built around live websites.",
  "Developer handoff is not part of your workflow and $79 a month is within budget: Markup.io's design-review polish is genuinely strong.",
  "You need SAML SSO and SOC II compliance today and cannot wait for self-hosted setup: Markup.io Enterprise ships that out of the box.",
];

export function MarkupIoHonestTakeSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            When Markup.io is still the right call
          </h2>
        </div>

        <ul className="mx-auto mt-10 max-w-2xl space-y-4">
          {points.map((point) => (
            <li
              key={point}
              className="rounded-xl border bg-background p-5 text-base leading-relaxed text-muted-foreground"
            >
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
