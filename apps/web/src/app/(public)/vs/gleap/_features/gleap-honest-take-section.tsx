const points = [
  {
    title: "Live chat and shared inbox",
    body: "Gleap bundles a chatbot, ticketing, and a shared inbox. FasterFixes has no support surface at all.",
  },
  {
    title: "Mobile SDKs",
    body: "Gleap ships iOS, Android, Flutter, and React Native SDKs. FasterFixes is web only: a script tag, plus packages for React, Vue, Angular, and Svelte.",
  },
  {
    title: "Deeper session replay",
    body: "Gleap replays the last 10 to 15 minutes before a report on Growth and above. FasterFixes records up to about a minute before each Feedback.",
  },
];

export function GleapHonestTakeSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            When Gleap is still the right call
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gleap is a support platform, and it does support better than
            FasterFixes does. Three cases where it wins:
          </p>
        </div>

        <ul className="mx-auto mt-10 max-w-2xl space-y-4">
          {points.map((point) => (
            <li
              key={point.title}
              className="rounded-xl border bg-background p-5 text-base leading-relaxed text-muted-foreground"
            >
              <span className="font-semibold text-foreground">
                {point.title}.
              </span>{" "}
              {point.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
