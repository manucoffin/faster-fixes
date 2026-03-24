import {
  ClipboardListIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  TerminalIcon,
} from "lucide-react";

const steps = [
  {
    number: "1",
    icon: MousePointerClickIcon,
    title: "Your client clicks on the element",
    description:
      "Add the React component to your app. Clients click any element to leave a comment. No account, no login, no onboarding.",
  },
  {
    number: "2",
    icon: MonitorSmartphoneIcon,
    title: "The widget captures full technical context",
    description:
      "Every technical detail your agent needs to locate and fix the issue — captured automatically. The client does not see any of this.",
  },
  {
    number: "3",
    icon: ClipboardListIcon,
    title: "Feedback lands as a structured task",
    description:
      "Every item appears in your dashboard as a formatted markdown report — and optionally as a GitHub issue, created automatically with full context. Page location, component path, client comment, screenshot, and environment details.",
  },
  {
    number: "4",
    icon: TerminalIcon,
    title: "Your coding agent takes it from there",
    description:
      "Copy the markdown into Claude Code, Cursor, or any AI coding agent. Or connect the MCP server and let the agent pull new feedback directly from your terminal. It gets enough context to locate the code and fix the issue without asking you for more information.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wider">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Client clicks. <br className="hidden sm:block" />
            Coding agent fixes. <br className="hidden sm:block" />
            You review.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            One npm install. No training your client. Feedback starts flowing in
            minutes.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {step.number}
                </div>
                <step.icon className="text-muted-foreground size-5" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
