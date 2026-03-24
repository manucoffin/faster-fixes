import {
  ClipboardListIcon,
  CodeIcon,
  MousePointerClickIcon,
} from "lucide-react";

const benefits = [
  {
    icon: MousePointerClickIcon,
    title: "Zero friction for clients",
    description:
      "No login, no training, no new tool to learn. Clients click, comment, and move on. The widget handles the rest.",
  },
  {
    icon: CodeIcon,
    title: "Built for developers",
    description:
      "Every feedback item includes the technical context you need — URL, screenshot, browser, viewport. Export as Markdown or connect to your existing workflow.",
  },
  {
    icon: ClipboardListIcon,
    title: "AI-structured tasks",
    description:
      "Raw client comments are transformed into clear, categorized developer tasks. Summaries, priorities, and action items — ready for your issue tracker or coding agent.",
  },
];

export function BenefitsSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Feedback that&apos;s already half the fix
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            When every feedback item arrives with full context, you skip the
            back-and-forth and go straight to shipping.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col gap-3">
              <benefit.icon className="text-primary size-8" />
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
