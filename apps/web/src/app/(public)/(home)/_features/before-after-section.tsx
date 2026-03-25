const scenes = [
  {
    without:
      "Your client sends a WhatsApp message: \"the button color is wrong on the pricing page I think.\" You open five pages looking for a pricing section.",
    with: "Your client clicks the button. The widget captures the element, the page URL, and a screenshot. The task is in your dashboard before they finish typing their comment.",
  },
  {
    without:
      "You screenshot the issue yourself, open Linear, write a task from memory, and hope you captured enough context.",
    with: "A GitHub issue is created automatically with the component path, source file, selector, and screenshot. Or you copy the structured markdown into your agent — it opens the file and starts fixing.",
  },
  {
    without:
      "Your coding agent asks: \"Which file? Which component? What browser?\" You spend 10 minutes finding answers.",
    with: "Your agent pulls the feedback via MCP, fixes the issue, and marks it resolved. You review the diff.",
  },
];

export function BeforeAfterSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            The workflow you have vs. the one you want
          </h2>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-6">
          {scenes.map((scene, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="rounded-lg border p-5">
                <span className="text-muted-foreground mb-2 block text-xs font-semibold uppercase tracking-wider">
                  Without FasterFixes
                </span>
                <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
                  {scene.without}
                </p>
              </div>

              <div className="border-primary/20 bg-primary/5 rounded-lg border p-5">
                <span className="text-primary mb-2 block text-xs font-semibold uppercase tracking-wider">
                  With FasterFixes
                </span>
                <p className="text-lg leading-relaxed md:text-xl">{scene.with}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
