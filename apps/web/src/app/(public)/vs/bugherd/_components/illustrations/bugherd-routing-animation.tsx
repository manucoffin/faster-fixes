import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  CircleDotIcon,
  CodeIcon,
  ImageIcon,
  MonitorIcon,
  PaperclipIcon,
  TerminalIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle.
const PIN = 5;
const BUBBLE = 8;
const TYPE_START = 10;
const TYPE_END = 22;
const LINE_PAGE = 26;
const CHIPS_START = 30;
const CHIP_STAGGER = 4;
const LINE_BUNDLE = 47;
const ISSUE = 51;
const LINE_ISSUE = 60;
const AGENT_CALL = 64;
const AGENT_OUT = 70;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;
// Time a connector takes to fill, in percentages of the cycle.
const GROW = 4;

const COMMENT = "Button overlaps the footer";

// Where the pin sits on the mock page: on the button that overlaps the footer.
const PIN_POINT = { x: "23%", y: "78%" };

const IDLE_DOT = "rgb(255 255 255 / 0.35)";

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, and the one-off flashes, so the
// reduced-motion block can freeze each on its final state.
const enterClasses: string[] = [];
const flashClasses: string[] = [];
const growClasses: string[] = [];

// Shown from `at` until the reset.
function enter(name: string, at: number, hidden = HIDDEN, fade = FADE) {
  enterClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { ${hidden} }
  ${at + fade}%, ${RESET}% { ${SHOWN} }
  ${RESET + FADE}%, 100% { ${hidden} }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// A brief highlight at `at`.
function flash(name: string, at: number) {
  flashClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; }
  ${at + 1}% { opacity: 1; }
  ${at + 7}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-out infinite; }`;
}

// A connector filling along its axis from `at`.
function grow(name: string, at: number, axis: "X" | "Y") {
  growClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; transform: scale${axis}(0); }
  ${at + GROW}%, ${RESET}% { opacity: 1; transform: scale${axis}(1); }
  ${RESET + FADE}%, 100% { opacity: 0; transform: scale${axis}(1); }
}
.${name} { transform: scale${axis}(0); animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

const BUNDLE_CHIPS = [
  { icon: CodeIcon, label: "button.cta" },
  {
    icon: TerminalIcon,
    label: (
      <>
        Console
        <span className="rounded-[3px] bg-destructive/15 px-1 font-medium text-destructive">
          2
        </span>
      </>
    ),
  },
  { icon: ImageIcon, label: "Screenshot" },
  { icon: MonitorIcon, label: "Chrome · 1440×900" },
] as const;

function chipKeyframes() {
  return BUNDLE_CHIPS.map((_, i) =>
    enter(
      `bra-chip-${i}`,
      CHIPS_START + i * CHIP_STAGGER,
      "opacity: 0; transform: scale(0.85);",
    ),
  ).join("\n");
}

const styles = `
${chipKeyframes()}
${enter("bra-pin", PIN, "opacity: 0; transform: scale(0.4);")}
${enter("bra-bubble", BUBBLE)}
${enter("bra-issue", ISSUE, "opacity: 0; transform: translateY(8px);", 3)}
${enter("bra-agent-call", AGENT_CALL)}
${enter("bra-agent-out", AGENT_OUT)}
${flash("bra-glow", ISSUE + 2)}
${grow("bra-line-page", LINE_PAGE, "Y")}
${grow("bra-line-bundle", LINE_BUNDLE, "Y")}
${grow("bra-line-issue", LINE_ISSUE, "X")}

@keyframes bra-ripple {
  0%, ${PIN - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${PIN}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${PIN + 5}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}

@keyframes bra-type {
  0%, ${TYPE_START}% { clip-path: inset(0 100% 0 0); animation-timing-function: steps(${COMMENT.length}, end); }
  ${TYPE_END}%, ${RESET + FADE}% { clip-path: inset(0 0 0 0); }
  ${RESET + FADE + 1}%, 100% { clip-path: inset(0 100% 0 0); }
}

@keyframes bra-dot {
  0%, ${AGENT_OUT - 1}% { color: ${IDLE_DOT}; }
  ${AGENT_OUT}%, 100% { color: var(--color-success); }
}

.bra-ripple { opacity: 0; animation: bra-ripple ${CYCLE}s ease-out infinite; }
.bra-type { clip-path: inset(0 100% 0 0); animation: bra-type ${CYCLE}s linear infinite; }
.bra-dot { color: ${IDLE_DOT}; animation: bra-dot ${CYCLE}s step-end infinite; }

@media (prefers-reduced-motion: reduce) {
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${growClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${flashClasses.map((name) => `.${name}`).join(", ")}, .bra-ripple { animation: none; opacity: 0; }
  .bra-type { animation: none; clip-path: none; }
  .bra-dot { animation: none; color: var(--color-success); }
}
`;

type BugherdRoutingAnimationProps = {
  className?: string;
};

export function BugherdRoutingAnimation({
  className,
}: BugherdRoutingAnimationProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "@container flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl border bg-background p-3 shadow-sm sm:aspect-[5/4] @[30rem]:p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_30%] gap-2 @[30rem]:gap-3">
        <MockPage />
        <KanbanColumn />
      </div>

      <ConnectorRow
        columns="grid-cols-[minmax(0,1fr)_30%]"
        line="bra-line-page"
      />

      <ReproBundle />

      <ConnectorRow
        columns="grid-cols-[minmax(0,1fr)_0.75rem_minmax(0,1fr)]"
        line="bra-line-bundle"
      />

      <div className="grid grid-cols-[minmax(0,1fr)_0.75rem_minmax(0,1fr)] items-stretch">
        <TrackerIssue />
        <div className="flex items-center">
          <span className="relative h-px w-full bg-border">
            <span className="bra-line-issue absolute inset-0 origin-left bg-primary" />
          </span>
        </div>
        <AgentTerminal />
      </div>
    </div>
  );
}

type ConnectorRowProps = {
  columns: string;
  line: string;
};

// A vertical connector centred on the first column of the row below it.
function ConnectorRow({ columns, line }: ConnectorRowProps) {
  return (
    <div className={cn("grid shrink-0", columns)}>
      <div className="flex justify-center">
        <span className="relative h-3 w-px bg-border @[30rem]:h-4">
          <span
            className={cn("absolute inset-0 origin-top bg-primary", line)}
          />
        </span>
      </div>
    </div>
  );
}

function MockPage() {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex h-5 shrink-0 items-center gap-1 border-b px-2 @[30rem]:h-6">
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="size-1.5 rounded-full bg-foreground/15" />
        <span className="ml-1 truncate rounded-[3px] bg-muted px-1.5 text-[10px] leading-4 text-muted-foreground">
          acme.com/pricing
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute top-[10%] left-[8%] h-[7%] w-[50%] rounded-[2px] bg-foreground/15" />
        <div className="absolute top-[22%] left-[8%] h-[5%] w-[70%] rounded-[2px] bg-foreground/10" />
        <div className="absolute top-[31%] left-[8%] h-[5%] w-[56%] rounded-[2px] bg-foreground/10" />

        {/* The footer, with the call-to-action button spilling over it: the bug the client reports. */}
        <div className="absolute inset-x-0 bottom-0 flex h-[22%] items-end gap-[6%] bg-muted px-[8%] pb-[5%]">
          <span className="h-1 w-[18%] rounded-full bg-foreground/15" />
          <span className="h-1 w-[14%] rounded-full bg-foreground/15" />
          <span className="h-1 w-[16%] rounded-full bg-foreground/15" />
        </div>
        <div className="absolute top-[71%] left-[8%] h-[14%] w-[30%] rounded-[4px] bg-primary/80 shadow-sm" />

        <CommentBubble />

        <span
          className="bra-ripple absolute z-10 size-6 rounded-full border-2 border-primary/60"
          style={{ left: PIN_POINT.x, top: PIN_POINT.y }}
        />
        <span
          className="bra-pin absolute z-10 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground shadow ring-2 ring-background"
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
    <div className="bra-bubble absolute top-[42%] left-[22%] z-20 max-w-[74%] rounded-md border bg-popover px-2 py-1 shadow-md">
      <p className="bra-type truncate text-[10px] leading-4 font-medium text-popover-foreground @[30rem]:text-xs @[30rem]:leading-5">
        {COMMENT}
      </p>
    </div>
  );
}

// The destination a Kanban-first tool routes to, drawn muted and generic.
function KanbanColumn() {
  return (
    <div className="flex min-h-0 flex-col gap-1.5 overflow-hidden rounded-lg border border-dashed bg-muted/40 p-1.5 opacity-70 @[30rem]:p-2">
      <div className="flex flex-col leading-tight">
        <span className="truncate text-[10px] font-medium text-muted-foreground @[30rem]:text-[11px]">
          BugHerd
        </span>
        <span className="truncate text-[10px] text-muted-foreground/80 @[30rem]:text-[11px]">
          Kanban board
        </span>
      </div>
      <PlaceholderCard lines={["w-[80%]", "w-[50%]"]} />
      <PlaceholderCard lines={["w-[65%]"]} />
      <PlaceholderCard lines={["w-[70%]", "w-[40%]"]} />
      <PlaceholderCard lines={["w-[55%]"]} />
    </div>
  );
}

type PlaceholderCardProps = {
  lines: string[];
};

function PlaceholderCard({ lines }: PlaceholderCardProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1 rounded-[4px] border bg-background p-1.5">
      {lines.map((width) => (
        <span
          key={width}
          className={cn("h-1 rounded-full bg-foreground/10", width)}
        />
      ))}
    </div>
  );
}

function ReproBundle() {
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground @[30rem]:text-[11px]">
        Repro bundle
      </span>
      <ul className="flex flex-wrap gap-1 @[30rem]:gap-1.5">
        {BUNDLE_CHIPS.map(({ icon: Icon, label }, i) => (
          <Chip key={i} index={i} icon={<Icon className="size-3 shrink-0" />}>
            {label}
          </Chip>
        ))}
      </ul>
    </div>
  );
}

type ChipProps = {
  index: number;
  icon: ReactNode;
  children: ReactNode;
};

function Chip({ index, icon, children }: ChipProps) {
  return (
    <li
      className={cn(
        `bra-chip-${index}`,
        "flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-foreground @[30rem]:text-[11px]",
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </li>
  );
}

function TrackerIssue() {
  return (
    <div className="bra-issue relative flex min-w-0 flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-sm @[30rem]:p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <GithubIcon className="size-3 shrink-0 text-foreground" />
        <LinearIcon className="size-3 shrink-0" />
        <JiraIcon className="size-3 shrink-0" />
        <span className="ml-auto truncate text-[10px] @[30rem]:text-[11px]">
          #482
        </span>
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug font-medium text-foreground @[30rem]:text-xs">
        {COMMENT}
      </p>
      <div className="mt-auto flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground @[30rem]:text-[11px]">
        <span className="flex items-center gap-1 text-success">
          <CircleDotIcon className="size-3 shrink-0" />
          Open
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <PaperclipIcon className="size-3 shrink-0" />
          <span className="truncate">Repro</span>
        </span>
      </div>
      <span className="bra-glow pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary/60 ring-inset" />
    </div>
  );
}

function AgentTerminal() {
  return (
    <TerminalFrame
      title="~/acme"
      contentClassName="flex min-w-0 flex-1 flex-col gap-1 px-2 py-1.5 font-mono text-[10px] leading-snug @[30rem]:px-2.5 @[30rem]:py-2 @[30rem]:text-[11px]"
    >
      <span className="truncate text-white/45">Claude Code · MCP</span>
      <div className="bra-agent-call flex min-w-0 gap-1.5">
        <span className="bra-dot shrink-0">⏺</span>
        <span className="min-w-0 truncate text-white/90">list_feedbacks</span>
      </div>
      <div className="bra-agent-out flex min-w-0 gap-1.5 pl-2.5">
        <span className="shrink-0 text-white/30">⎿</span>
        <span className="min-w-0 truncate text-white/60">#482 {COMMENT}</span>
      </div>
    </TerminalFrame>
  );
}
