import {
  ArrowLeftRightIcon,
  CameraIcon,
  ComponentIcon,
  HistoryIcon,
  type LucideIcon,
  MousePointerClickIcon,
  ScanSearchIcon,
  TerminalIcon,
} from "lucide-react";
import {
  AgentContextIllustration,
  ContextIllustrationStyles,
  HumanContextIllustration,
} from "./context-illustrations";

type ContextPoint = {
  Icon: LucideIcon;
  title: string;
  description: string;
};

const humanPoints: ContextPoint[] = [
  {
    Icon: CameraIcon,
    title: "Screenshot",
    description:
      "The page as it looked when your client clicked, captured automatically.",
  },
  {
    Icon: MousePointerClickIcon,
    title: "Selected element",
    description:
      "The exact element they pointed at, outlined on the screenshot. No guessing which button they meant.",
  },
  {
    Icon: HistoryIcon,
    title: "Recording of the last minute",
    description:
      "Replay the clicks, scrolls and pages visited right before the feedback. You see how they got there, not only where they ended up.",
  },
];

const agentPoints: ContextPoint[] = [
  {
    Icon: TerminalIcon,
    title: "Console history",
    description:
      "Every console message leading up to the feedback, errors and warnings included.",
  },
  {
    Icon: ArrowLeftRightIcon,
    title: "Network requests",
    description:
      "Every fetch and XHR call, with method, URL, status code and duration. A failed request stands out.",
  },
  {
    Icon: ComponentIcon,
    title: "React component path",
    description:
      "The component tree of the selected element. In development builds, the source file and line too.",
  },
  {
    Icon: ScanSearchIcon,
    title: "Element context",
    description: "CSS selectors, nearby text, browser, OS and viewport size.",
  },
];

const columns = [
  {
    label: "For you",
    title: "See what your client saw",
    Illustration: HumanContextIllustration,
    points: humanPoints,
    footnote:
      "Your client does not have to start anything. Text they typed is never recorded.",
    callout: "Understand the problem without a single follow-up question.",
  },
  {
    label: "For your coding agent",
    title: "Give your agent the data it reads best",
    Illustration: AgentContextIllustration,
    points: agentPoints,
    footnote: null,
    callout:
      "Then ask your agent to fix it. Through MCP, it fetches the feedback with all of this context and gets to work.",
  },
];

export function ContextSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <ContextIllustrationStyles />
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What you get
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Context for you. Context for your agent.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Every feedback captures what you need to understand the problem, and
            what your coding agent needs to fix it.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {columns.map(
            ({ label, title, Illustration, points, footnote, callout }) => (
              <div
                key={label}
                className="flex flex-col rounded-xl border bg-card p-7"
              >
                <span className="mb-2 block text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  {label}
                </span>
                <h3 className="text-xl font-semibold md:text-2xl">{title}</h3>

                <div className="mt-6">
                  <Illustration />
                </div>

                <ul className="mt-7 flex flex-col gap-5">
                  {points.map(({ Icon, title: pointTitle, description }) => (
                    <li key={pointTitle} className="flex items-start gap-3">
                      <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{pointTitle}</p>
                        <p className="mt-1 leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {footnote && (
                  <p className="mt-5 text-sm text-muted-foreground">
                    {footnote}
                  </p>
                )}

                <div className="mt-auto pt-7">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium">
                    {callout}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
