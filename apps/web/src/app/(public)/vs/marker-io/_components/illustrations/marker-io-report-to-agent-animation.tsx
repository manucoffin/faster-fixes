import { cn } from "@workspace/ui/lib/utils";
import {
  AtomIcon,
  CodeIcon,
  GlobeIcon,
  ImageIcon,
  TerminalIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle: the client pins a comment, the report fills with
// its captured context, then the agent fetches it over MCP and fixes the file.
const PIN = 4;
const BUBBLE = 7;
const TYPE_START = 9;
const TYPE_END = 19;
const REPORT = 21;
const FIELDS_START = 25;
const FIELD_STAGGER = 4;
const LEAF = 46;
const LINE_MCP = 50;
const PROMPT = 54;
const CALL = 57;
const CALL_OUT = 61;
const READ = 66;
const UPDATE = 71;
const DIFF = 74;
const DONE = 80;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;
// Time a connector takes to fill, in percentages of the cycle.
const GROW = 4;

const COMMENT = "Subscribe does nothing";
const COMPONENT_FILE = "src/components/SubscribeButton.tsx";

// Where the pin sits on the mock page: on the footer's subscribe button.
const PIN_POINT = { x: "70%", y: "84%" };

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, so the reduced-motion block can freeze
// each on its final state.
const enterClasses: string[] = [];
const growClasses: string[] = [];

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

// A connector filling along its axis from `at`.
function grow(name: string, at: number) {
  growClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; transform: scaleY(0); }
  ${at + GROW}%, ${RESET}% { opacity: 1; transform: scaleY(1); }
  ${RESET + FADE}%, 100% { opacity: 0; transform: scaleY(1); }
}
.${name} { transform: scaleY(0); animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

const TERMINAL_STEPS = [
  { name: "mra-prompt", at: PROMPT },
  { name: "mra-call", at: CALL },
  { name: "mra-call-out", at: CALL_OUT },
  { name: "mra-read", at: READ },
  { name: "mra-update", at: UPDATE },
  { name: "mra-diff", at: DIFF },
  { name: "mra-done", at: DONE },
] as const;

type TerminalStepName = (typeof TERMINAL_STEPS)[number]["name"];

const REPORT_FIELDS = [
  {
    icon: ImageIcon,
    label: (
      <>
        Screenshot
        <span className="text-muted-foreground">1440×900</span>
      </>
    ),
  },
  { icon: CodeIcon, label: "footer > button.subscribe" },
  {
    icon: TerminalIcon,
    label: (
      <>
        Console
        <span className="rounded-[3px] bg-destructive/15 px-1 font-medium text-destructive">
          1 error
        </span>
      </>
    ),
  },
  {
    icon: GlobeIcon,
    label: (
      <>
        <span className="truncate">POST /api/subscribe</span>
        <span className="shrink-0 font-medium text-destructive">500</span>
      </>
    ),
  },
] as const;

// The React component tree, root to the component that owns the bug.
const COMPONENT_TREE = ["App", "Footer", "SubscribeButton"] as const;

const styles = `
${REPORT_FIELDS.map((_, i) => enter(`mra-field-${i}`, FIELDS_START + i * FIELD_STAGGER)).join("\n")}
${enter("mra-tree", FIELDS_START + REPORT_FIELDS.length * FIELD_STAGGER)}
${enter("mra-pin", PIN, "opacity: 0; transform: scale(0.4);")}
${enter("mra-bubble", BUBBLE)}
${enter("mra-report", REPORT, "opacity: 0; transform: translateY(8px);")}
${enter("mra-leaf", LEAF, "opacity: 0; transform: none;")}
${enter("mra-mcp", LINE_MCP + 1, "opacity: 0; transform: scale(0.85);")}
${TERMINAL_STEPS.map(({ name, at }) => enter(name, at)).join("\n")}
${grow("mra-line-mcp", LINE_MCP)}

@keyframes mra-ripple {
  0%, ${PIN - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${PIN}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${PIN + 5}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}

@keyframes mra-type {
  0%, ${TYPE_START}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${COMMENT.length}, end); }
  ${TYPE_END}%, ${RESET + FADE}% { clip-path: inset(0 0 0 0); }
  ${RESET + FADE + 1}%, 100% { clip-path: inset(0 100% 0 0); }
}

@keyframes mra-dot {
  0%, ${CALL_OUT - 1}% { color: var(--color-muted-foreground); }
  ${CALL_OUT}%, 100% { color: var(--color-success); }
}

.mra-ripple { opacity: 0; animation: mra-ripple ${CYCLE}s ease-out infinite; }
.mra-type { clip-path: inset(0 100% 0 0); animation: mra-type ${CYCLE}s linear infinite; }
.mra-dot { color: var(--color-muted-foreground); animation: mra-dot ${CYCLE}s step-end infinite; }

@media (prefers-reduced-motion: reduce) {
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${growClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  .mra-ripple { animation: none; opacity: 0; }
  .mra-type { animation: none; clip-path: none; }
  .mra-dot { animation: none; color: var(--color-success); }
}
`;

type MarkerIoReportToAgentAnimationProps = {
  className?: string;
};

export function MarkerIoReportToAgentAnimation({
  className,
}: MarkerIoReportToAgentAnimationProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "@container flex w-full flex-col overflow-hidden rounded-2xl border bg-background p-3 shadow-sm @[30rem]:p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 @[30rem]:gap-3">
        <MockPage />
        <ReportCard />
      </div>

      <McpConnector />

      <AgentTerminal />
    </div>
  );
}

function MockPage() {
  return (
    <div className="flex min-h-36 flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex h-5 shrink-0 items-center gap-1 border-b px-2 @[30rem]:h-6">
        <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
        <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
        <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
        <span className="ml-1 min-w-0 truncate rounded-[3px] bg-muted px-1.5 text-[10px] leading-4 text-muted-foreground">
          acme.com
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute top-[9%] left-[10%] h-[7%] w-[62%] rounded-[2px] bg-foreground/15" />
        <div className="absolute top-[21%] left-[10%] h-[5%] w-[78%] rounded-[2px] bg-foreground/10" />
        <div className="absolute top-[30%] left-[10%] h-[5%] w-[56%] rounded-[2px] bg-foreground/10" />

        {/* The footer, whose subscribe button the client reports as broken. */}
        <div className="absolute inset-x-0 bottom-0 flex h-[30%] items-center gap-[6%] bg-muted px-[10%]">
          <span className="h-[18%] w-[38%] rounded-[2px] border bg-background" />
          <span className="h-[26%] w-[34%] rounded-[3px] bg-primary/80" />
        </div>

        <CommentBubble />

        <span
          className="mra-ripple absolute z-10 size-6 rounded-full border-2 border-primary/60"
          style={{ left: PIN_POINT.x, top: PIN_POINT.y }}
        />
        <span
          className="mra-pin absolute z-10 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground shadow ring-2 ring-background"
          style={{ left: PIN_POINT.x, top: PIN_POINT.y }}
        >
          1
        </span>
      </div>
    </div>
  );
}

function CommentBubble() {
  return (
    <div className="mra-bubble absolute top-[42%] right-[6%] left-[6%] z-20 rounded-md border bg-popover px-1.5 py-1 shadow-md">
      <p className="mra-type truncate text-[10px] leading-4 font-medium text-popover-foreground @[30rem]:text-[11px]">
        {COMMENT}
      </p>
    </div>
  );
}

function ReportCard() {
  return (
    <div className="mra-report flex min-w-0 flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-sm @[30rem]:p-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        <span className="min-w-0 truncate text-[10px] font-medium text-foreground @[30rem]:text-[11px]">
          {COMMENT}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
          #128
        </span>
      </div>

      <ul className="flex flex-col gap-1 border-t pt-1.5">
        {REPORT_FIELDS.map(({ icon: Icon, label }, i) => (
          <ReportField
            key={i}
            className={`mra-field-${i}`}
            icon={<Icon className="size-3 shrink-0" />}
          >
            {label}
          </ReportField>
        ))}
        <ReportField
          className="mra-tree"
          icon={<AtomIcon className="size-3 shrink-0" />}
        >
          <ComponentTree />
        </ReportField>
      </ul>
    </div>
  );
}

type ReportFieldProps = {
  className: string;
  icon: ReactNode;
  children: ReactNode;
};

function ReportField({ className, icon, children }: ReportFieldProps) {
  return (
    <li
      className={cn(
        "flex min-w-0 items-start gap-1.5 font-mono text-[10px] leading-4 text-foreground @[30rem]:text-[11px]",
        className,
      )}
    >
      <span className="flex h-4 shrink-0 items-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
        {children}
      </span>
    </li>
  );
}

function ComponentTree() {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      {COMPONENT_TREE.map((name, depth) => {
        const isLeaf = depth === COMPONENT_TREE.length - 1;
        return (
          <span
            key={name}
            className="relative flex min-w-0 items-center gap-1"
            style={{ paddingLeft: `${depth * 0.625}rem` }}
          >
            {depth > 0 && (
              <span className="shrink-0 text-muted-foreground/60">└</span>
            )}
            <span
              className={cn(
                "relative z-10 truncate",
                isLeaf ? "font-medium" : "text-muted-foreground",
              )}
            >
              {name}
            </span>
            {isLeaf && (
              <span className="mra-leaf absolute inset-y-0 right-0 -left-0.5 rounded-[3px] bg-primary/10 ring-1 ring-primary/50 ring-inset" />
            )}
          </span>
        );
      })}
    </span>
  );
}

// The hand-off: the report leaves the dashboard for the agent over MCP.
function McpConnector() {
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 @[30rem]:gap-3">
      <div />
      <div className="relative flex justify-center">
        <span className="relative h-5 w-px bg-border @[30rem]:h-6">
          <span className="mra-line-mcp absolute inset-0 origin-top bg-primary" />
        </span>
        <span className="mra-mcp absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 rounded-full border bg-background px-1.5 font-mono text-[9px] leading-4 text-muted-foreground @[30rem]:text-[10px]">
          MCP
        </span>
      </div>
    </div>
  );
}

type TerminalStepProps = {
  step: TerminalStepName;
  className?: string;
  children: ReactNode;
};

function TerminalStep({ step, className, children }: TerminalStepProps) {
  return (
    <div className={cn("flex min-w-0 gap-1.5", step, className)}>
      {children}
    </div>
  );
}

type ToolCallProps = {
  name: string;
  target: string;
};

function ToolCall({ name, target }: ToolCallProps) {
  return (
    <span className="min-w-0 truncate text-foreground">
      <span className="font-semibold">{name}</span>
      <span className="text-muted-foreground">({target})</span>
    </span>
  );
}

function AgentTerminal() {
  return (
    <TerminalFrame
      title="~/acme"
      contentClassName="dark flex min-w-0 flex-col gap-1 px-2.5 pt-2 pb-2.5 font-mono text-[10px] leading-snug @[30rem]:px-3.5 @[30rem]:pb-3 @[30rem]:text-[11px]"
    >
      <span className="truncate text-muted-foreground/70">
        Claude Code · faster-fixes MCP connected
      </span>

      <TerminalStep step="mra-prompt" className="text-muted-foreground">
        <span className="shrink-0">&gt;</span>
        <span className="truncate">Fix the open feedback on acme.com</span>
      </TerminalStep>

      <TerminalStep step="mra-call">
        <span className="mra-dot shrink-0">⏺</span>
        <span className="min-w-0 truncate text-foreground">
          <span className="font-semibold">faster-fixes - get_feedback</span>{" "}
          <span className="text-muted-foreground">(MCP)</span>
        </span>
      </TerminalStep>

      <TerminalStep step="mra-call-out" className="pl-3">
        <span className="shrink-0 text-muted-foreground/60">⎿</span>
        <span className="min-w-0 truncate text-muted-foreground">
          #128 · <span className="text-primary">SubscribeButton</span> · POST
          500
        </span>
      </TerminalStep>

      <TerminalStep step="mra-read">
        <span className="shrink-0 text-success">⏺</span>
        <ToolCall name="Read" target={COMPONENT_FILE} />
      </TerminalStep>

      <TerminalStep step="mra-update">
        <span className="shrink-0 text-success">⏺</span>
        <ToolCall name="Update" target={COMPONENT_FILE} />
      </TerminalStep>

      <TerminalStep step="mra-diff" className="pl-3">
        <span className="shrink-0 text-muted-foreground/60">⎿</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate rounded-[2px] bg-destructive/15 px-1 text-destructive">
            18 - fetch(&quot;/api/subscribe&quot;)
          </span>
          <span className="truncate rounded-[2px] bg-success/15 px-1 text-success">
            18 + await fetch(&quot;/api/subscribe&quot;, &#123; body &#125;)
          </span>
        </span>
      </TerminalStep>

      <TerminalStep step="mra-done">
        <span className="shrink-0 text-success">⏺</span>
        <span className="min-w-0 truncate text-success">
          Fixed #128. Feedback marked resolved.
        </span>
      </TerminalStep>
    </TerminalFrame>
  );
}
