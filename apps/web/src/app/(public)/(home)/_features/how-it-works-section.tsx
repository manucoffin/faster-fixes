const steps = [
  {
    number: "1",
    title: "Your client annotates any element",
    description:
      "No account, no onboarding. They click, leave a comment, and move on. Screenshot, URL, component path, and browser details are captured automatically.",
  },
  {
    number: "2",
    title: "Feedback is structured and agent-ready",
    description:
      "The widget structures every detail automatically. Your agent receives a complete report and knows exactly where to look.",
  },
  {
    number: "3",
    title: "Your agent pulls it and fixes it automatically",
    description:
      "Connect the MCP server once. Your agent fetches new feedback, locates the code, applies the fix, and marks it resolved. Fully unattended.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Client clicks. <br className="hidden sm:block" />
            Coding agent fixes. <br className="hidden sm:block" />
            You review.
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold md:text-xl">{step.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
