import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, LinkIcon, MessageSquareIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TerminalFrame } from "../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle: the competitor's script line is marked and struck
// out, its launcher leaves the page, the FasterFixes tag is typed line by
// line, then the Feedback button appears and the review link is copied.
const MARK = 6;
const STRIKE = 10;
const OLD_WIDGET_OUT = 16;
const TYPE_START = 22;
const TYPE_STEP = 6;
const NEW_WIDGET = 50;
const LINK = 60;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;
// Time one added line takes to type.
const TYPE = 5;

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes grouped by the state the reduced-motion block freezes them on.
const enterClasses: string[] = [];
const leaveClasses: string[] = [];
const revealClasses: string[] = [];

// Shown from `at` until the reset.
function enter(name: string, at: number, hidden = HIDDEN) {
  enterClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { ${hidden} }
  ${at + FADE}%, ${RESET}% { ${SHOWN} }
  ${RESET + FADE}%, 100% { ${hidden} }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// Hidden from `at` until the reset.
function leave(name: string, at: number) {
  leaveClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; }
  ${at + FADE}%, ${RESET}% { opacity: 0; }
  ${RESET + FADE}%, 100% { opacity: 1; }
}
.${name} { animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// Uncovered left to right between `at` and `at + duration`, like typed text.
function reveal(name: string, at: number, duration: number) {
  revealClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { clip-path: inset(0 100% 0 0); }
  ${at + duration}%, ${RESET}% { clip-path: inset(0 0 0 0); opacity: 1; }
  ${RESET + FADE}%, 100% { clip-path: inset(0 0 0 0); opacity: 0; }
}
.${name} { clip-path: inset(0 100% 0 0); animation: ${name} ${CYCLE}s linear infinite; }`;
}

const PROJECT_ID = "proj_your_project_id";
const WIDGET_SRC =
  "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js";

const ADDED_LINES: ReactNode[] = [
  <Tag key="open">&lt;script</Tag>,
  <Attr key="src" name="src" value={WIDGET_SRC} indent />,
  <Attr key="id" name="data-project-id" value={PROJECT_ID} indent />,
  <span key="close" className="pl-3">
    <Attr name="defer" />
    <Tag>&gt;&lt;/script&gt;</Tag>
  </span>,
];

const typeAt = (line: number) => TYPE_START + line * TYPE_STEP;

const styles = `
${enter("wsa-mark", MARK, "opacity: 0;")}
${leave("wsa-keep", MARK)}
${reveal("wsa-strike", STRIKE, 4)}
${leave("wsa-old-widget", OLD_WIDGET_OUT)}
${ADDED_LINES.map((_, line) =>
  [
    enter(`wsa-add-${line}`, typeAt(line), "opacity: 0;"),
    reveal(`wsa-type-${line}`, typeAt(line), TYPE),
  ].join("\n"),
).join("\n")}
${enter("wsa-new-widget", NEW_WIDGET, "opacity: 0; transform: translateY(4px) scale(0.9);")}
${enter("wsa-link", LINK)}

@media (prefers-reduced-motion: reduce) {
  ${[...enterClasses, ...revealClasses].map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; clip-path: none; }
  ${leaveClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
}
`;

const STEPS = [
  { label: "Export", state: "done" },
  { label: "Deploy", state: "done" },
  { label: "Replace", state: "active" },
  { label: "Connect", state: "next" },
] as const;

type WidgetSwapAnimationProps = {
  competitorName: string;
  competitorScriptSrc: string;
  className?: string;
};

export function WidgetSwapAnimation({
  competitorName,
  competitorScriptSrc,
  className,
}: WidgetSwapAnimationProps) {
  return (
    <figure
      aria-hidden
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <StepStrip />
      <HtmlDiff competitorScriptSrc={competitorScriptSrc} />
      <PagePreview competitorName={competitorName} />
    </figure>
  );
}

function StepStrip() {
  return (
    <ol className="flex min-w-0 items-center gap-1 sm:gap-1.5">
      {STEPS.map(({ label, state }, index) => (
        <li key={label} className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          {index > 0 ? (
            <span className="h-px w-2 shrink-0 bg-border sm:w-3" />
          ) : null}
          <span
            className={cn(
              "flex min-w-0 items-center gap-1 rounded-full border px-1.5 text-[10px] leading-5 font-medium sm:px-2 sm:text-[11px]",
              state === "done" && "bg-background text-muted-foreground",
              state === "active" &&
                "border-primary/30 bg-primary/10 text-primary",
              state === "next" &&
                "border-dashed bg-background text-muted-foreground/70",
            )}
          >
            {state === "done" ? (
              <CheckIcon className="size-2.5 shrink-0 text-success" />
            ) : (
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  state === "active" ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span className="truncate">{label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

type HtmlDiffProps = {
  competitorScriptSrc: string;
};

// The terminal is scoped to the dark theme, so these resolve to its values.
function HtmlDiff({ competitorScriptSrc }: HtmlDiffProps) {
  return (
    <TerminalFrame
      title="index.html"
      contentClassName="dark flex flex-col py-2 font-mono text-[9px] leading-[1.7] sm:py-3 sm:text-[11px]"
    >
      <DiffLine>
        <Tag>&lt;head&gt;</Tag>
      </DiffLine>
      <DiffLine indent>
        <Tag>&lt;meta</Tag> <Attr name="charset" value="utf-8" />{" "}
        <Tag>/&gt;</Tag>
      </DiffLine>
      <RemovedLine competitorScriptSrc={competitorScriptSrc} />
      {ADDED_LINES.map((content, line) => (
        <div
          key={line}
          className={cn(
            `wsa-add-${line}`,
            "flex min-w-0 bg-success/10 pr-2.5 sm:pr-4",
          )}
        >
          <Gutter className="text-success">+</Gutter>
          <span className={cn(`wsa-type-${line}`, "min-w-0 truncate pl-3")}>
            {content}
          </span>
        </div>
      ))}
      <DiffLine>
        <Tag>&lt;/head&gt;</Tag>
      </DiffLine>
    </TerminalFrame>
  );
}

type RemovedLineProps = {
  competitorScriptSrc: string;
};

function RemovedLine({ competitorScriptSrc }: RemovedLineProps) {
  return (
    <div className="relative flex min-w-0 pr-2.5 sm:pr-4">
      <span className="wsa-mark absolute inset-0 bg-destructive/10" />
      <span className="relative grid shrink-0">
        <Gutter className="wsa-keep col-start-1 row-start-1" />
        <Gutter className="wsa-mark col-start-1 row-start-1 text-destructive">
          -
        </Gutter>
      </span>
      <span className="relative min-w-0 truncate pl-3">
        <Tag>&lt;script</Tag> <Attr name="src" value={competitorScriptSrc} />{" "}
        <Attr name="async" />
        <Tag>&gt;&lt;/script&gt;</Tag>
        <span className="wsa-strike absolute inset-x-3 top-1/2 h-px bg-destructive" />
      </span>
    </div>
  );
}

type DiffLineProps = {
  indent?: boolean;
  children: ReactNode;
};

function DiffLine({ indent = false, children }: DiffLineProps) {
  return (
    <div className="flex min-w-0 pr-2.5 sm:pr-4">
      <Gutter />
      <span className={cn("min-w-0 truncate", indent && "pl-3")}>
        {children}
      </span>
    </div>
  );
}

type GutterProps = {
  className?: string;
  children?: ReactNode;
};

function Gutter({ className, children }: GutterProps) {
  return (
    <span
      className={cn(
        "w-5 shrink-0 text-center text-muted-foreground/60 select-none sm:w-7",
        className,
      )}
    >
      {children}
    </span>
  );
}

type TagProps = {
  children: ReactNode;
};

function Tag({ children }: TagProps) {
  return <span className="text-muted-foreground">{children}</span>;
}

type AttrProps = {
  name: string;
  value?: string;
  indent?: boolean;
};

function Attr({ name, value, indent = false }: AttrProps) {
  return (
    <span className={cn(indent && "pl-3")}>
      <span className="text-foreground/80">{name}</span>
      {value === undefined ? null : (
        <>
          <span className="text-muted-foreground">=</span>
          <span className="text-foreground">&quot;{value}&quot;</span>
        </>
      )}
    </span>
  );
}

type PagePreviewProps = {
  competitorName: string;
};

function PagePreview({ competitorName }: PagePreviewProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex min-w-0 items-center gap-2 border-b px-2.5 py-1.5">
        <span className="flex shrink-0 gap-1">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
        </span>
        <span className="min-w-0 truncate rounded-md bg-muted px-2 font-mono text-[9px] leading-4 text-muted-foreground sm:text-[10px]">
          yourapp.com
        </span>
      </div>

      <div className="relative flex h-28 flex-col gap-1.5 p-3 sm:h-32">
        <span className="h-2 w-2/5 rounded-[2px] bg-muted-foreground/25" />
        <span className="h-1.5 w-4/5 rounded-[2px] bg-muted" />
        <span className="h-1.5 w-3/5 rounded-[2px] bg-muted" />
        <div className="mt-1 grid w-3/5 grid-cols-2 gap-1.5">
          <span className="h-8 rounded-md border bg-muted/50" />
          <span className="h-8 rounded-md border bg-muted/50" />
        </div>

        <span className="wsa-link absolute top-2 right-2 flex max-w-[60%] min-w-0 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 text-[9px] leading-4 font-medium text-success sm:text-[10px]">
          <LinkIcon className="size-2.5 shrink-0" />
          <span className="truncate">Review link copied</span>
        </span>

        <span className="absolute right-2 bottom-2 grid justify-items-end">
          <span className="wsa-old-widget col-start-1 row-start-1 flex max-w-28 min-w-0 items-center rounded-full border bg-muted px-2 text-[9px] leading-5 text-muted-foreground sm:text-[10px]">
            <span className="truncate">{competitorName}</span>
          </span>
          <span className="wsa-new-widget col-start-1 row-start-1 flex items-center gap-1 rounded-full bg-primary px-2 text-[9px] leading-5 font-medium text-primary-foreground shadow-sm sm:text-[10px]">
            <MessageSquareIcon className="size-2.5 shrink-0" />
            Feedback
          </span>
        </span>
      </div>
    </div>
  );
}
