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

const rows = [
  {
    title: "You see what your client saw",
    lead: "Understand the problem without a single follow-up question.",
    Illustration: HumanContextIllustration,
    points: humanPoints,
    footnote:
      "Your client does not have to start anything. Text they typed is never recorded.",
  },
  {
    title: "Your agent gets the data it reads best",
    lead: "Ask your agent to fix it. Through MCP, it fetches the feedback with all of this context and gets to work.",
    Illustration: AgentContextIllustration,
    points: agentPoints,
    footnote: null,
  },
];

export function ContextSection() {
  return (
    <section id="context" className="w-full scroll-mt-16 py-16 md:py-24">
      <ContextIllustrationStyles />
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-balance md:text-4xl">
            Built for you and your coding agent
          </h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground md:text-xl">
            Every feedback captures what you need to understand the problem, and
            what your coding agent needs to fix it.
          </p>
        </div>

        <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-20 md:mt-20 lg:gap-28">
          {rows.map(({ title, lead, Illustration, points, footnote }, i) => (
            <div
              key={title}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 === 1 ? "lg:order-last" : undefined}>
                <h3 className="text-2xl font-semibold text-balance md:text-3xl">
                  {title}
                </h3>
                <p className="mt-3 text-lg text-pretty text-muted-foreground">
                  {lead}
                </p>

                <ul className="mt-8 flex flex-col border-t">
                  {points.map(({ Icon, title: pointTitle, description }) => (
                    <li
                      key={pointTitle}
                      className="flex items-start gap-4 border-b py-4"
                    >
                      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{pointTitle}</p>
                        <p className="mt-1 leading-relaxed text-pretty text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {footnote && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {footnote}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-muted/50 p-4 sm:p-8">
                <Illustration />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
