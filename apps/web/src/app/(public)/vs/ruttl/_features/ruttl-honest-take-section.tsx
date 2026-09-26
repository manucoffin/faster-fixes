const points = [
  "You are a solo creator on Ruttl's free Basic plan and never expect to grow past 5 pages.",
  "Your stakeholders already live inside Ruttl's review workflow and you have no appetite for migration.",
];

export function RuttlHonestTakeSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            When Ruttl is still the right call
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
