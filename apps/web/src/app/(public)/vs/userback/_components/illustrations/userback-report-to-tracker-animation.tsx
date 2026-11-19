import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { cn } from "@workspace/ui/lib/utils";
import {
  AtomIcon,
  CircleDotIcon,
  CodeIcon,
  GlobeIcon,
  ImageIcon,
  InboxIcon,
  PaperclipIcon,
  TerminalIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle: the report fills with its captured context, skips
// the support inbox, lands as a tracker issue, then the agent fetches it.
const REPORT = 3;
const FIELDS_START = 9;
const FIELD_STAGGER = 4;
const INBOX_CUT = 31;
const LINE_TRACKER = 33;
const ISSUE = 38;
const LINE_MCP = 50;
const CALL = 55;
const CALL_OUT = 61;
const READ = 68;
const DONE = 75;
const RESET = 92;

// Length of a fade in or out, in percentages of the cycle.
const FADE = 2;
// Time a connector takes to fill, in percentages of the cycle.
const GROW = 4;
// Time a highlight stays lit, in percentages of the cycle.
const FLASH = 10;

const TITLE = "Cart total ignores the discount";
const ISSUE_ID = "#214";
const COMPONENT_FILE = "src/cart/CartTotal.tsx";

const HIDDEN = "opacity: 0; transform: translateY(4px);";
const SHOWN = "opacity: 1; transform: none;";

// Classes that end the cycle shown, the one-off flashes and the connectors,
// so the reduced-motion block can freeze each on its final state.
const enterClasses: string[] = [];
const flashClasses: string[] = [];
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

// Lit briefly from `at`, then gone.
function flash(name: string, at: number) {
  flashClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 0; }
  ${at + FADE}% { opacity: 1; }
  ${at + FLASH}%, 100% { opacity: 0; }
}
.${name} { opacity: 0; animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

// A connector filling downward from `at`.
function grow(name: string, at: number) {
  growClasses.push(name);
  return `@keyframes ${name} {
  0%, ${at}% { opacity: 1; transform: scaleY(0); }
  ${at + GROW}%, ${RESET}% { opacity: 1; transform: scaleY(1); }
  ${RESET + FADE}%, 100% { opacity: 0; transform: scaleY(1); }
}
.${name} { transform: scaleY(0); animation: ${name} ${CYCLE}s ease-in-out infinite; }`;
}

const REPORT_FIELDS = [
  { icon: ImageIcon, label: "Screenshot", wide: false },
  { icon: CodeIcon, label: "p.cart-total", wide: false },
  { icon: AtomIcon, label: "Cart > Summary > CartTotal", wide: true },
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
    wide: false,
  },
  {
    icon: GlobeIcon,
    label: (
      <>
        <span className="truncate">GET /api/cart</span>
        <span className="shrink-0 font-medium text-destructive">422</span>
      </>
    ),
    wide: false,
  },
] as const;

const TERMINAL_STEPS = [
  { name: "urt-call", at: CALL },
  { name: "urt-call-out", at: CALL_OUT },
  { name: "urt-read", at: READ },
  { name: "urt-done", at: DONE },
] as const;

type TerminalStepName = (typeof TERMINAL_STEPS)[number]["name"];

// The report and the tracker split the width the same way, so connectors line
// up with the card centres below them.
const COLUMNS =
  "grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 @[30rem]:gap-3";

const styles = `
${enter("urt-report", REPORT, "opacity: 0; transform: translateY(8px);")}
${REPORT_FIELDS.map((_, i) => enter(`urt-field-${i}`, FIELDS_START + i * FIELD_STAGGER)).join("\n")}
${enter("urt-cut", INBOX_CUT, "opacity: 0; transform: scale(0.4);")}
${enter("urt-issue", ISSUE, "opacity: 0; transform: translateY(-6px);")}
${enter("urt-mcp", LINE_MCP + 1, "opacity: 0; transform: scale(0.85);")}
${TERMINAL_STEPS.map(({ name, at }) => enter(name, at)).join("\n")}
${flash("urt-glow", ISSUE)}
${grow("urt-line-tracker", LINE_TRACKER)}
${grow("urt-line-mcp", LINE_MCP)}

@keyframes urt-dot {
  0%, ${CALL_OUT - 1}% { color: var(--color-muted-foreground); }
  ${CALL_OUT}%, 100% { color: var(--color-success); }
}

.urt-dot { color: var(--color-muted-foreground); animation: urt-dot ${CYCLE}s step-end infinite; }

@media (prefers-reduced-motion: reduce) {
  ${enterClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${growClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 1; transform: none; }
  ${flashClasses.map((name) => `.${name}`).join(", ")} { animation: none; opacity: 0; }
  .urt-dot { animation: none; color: var(--color-success); }
}
`;

type UserbackReportToTrackerAnimationProps = {
  className?: string;
};

export function UserbackReportToTrackerAnimation({
  className,
}: UserbackReportToTrackerAnimationProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "@container flex w-full flex-col overflow-hidden rounded-2xl border bg-background p-3 shadow-sm @[30rem]:p-5",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <ReportCard />

      <ForkConnector />

      <div className={COLUMNS}>
        <SupportInbox />
        <TrackerPanel />
      </div>

      <McpConnector />

      <AgentTerminal />
    </div>
  );
}

function ReportCard() {
  return (
    <div className="urt-report flex min-w-0 flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-sm @[30rem]:p-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        <span className="shrink-0 text-[10px] text-muted-foreground @[30rem]:text-[11px]">
          Client report
        </span>
        <span className="min-w-0 truncate text-[10px] font-medium text-foreground @[30rem]:text-[11px]">
          {TITLE}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
          {ISSUE_ID}
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-1 border-t pt-1.5">
        {REPORT_FIELDS.map(({ icon: Icon, label, wide }, i) => (
          <li
            key={i}
            className={cn(
              `urt-field-${i}`,
              "flex min-w-0 items-center gap-1.5 rounded-[4px] border bg-muted/40 px-1.5 font-mono text-[10px] leading-5 text-foreground @[30rem]:text-[11px]",
              wide && "col-span-2",
            )}
          >
            <Icon className="size-3 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Two drops from the report: a cut one to the inbox, a live one to the tracker.
function ForkConnector() {
  return (
    <div className={cn(COLUMNS, "shrink-0")}>
      <div className="relative flex justify-center">
        <span className="h-5 border-l border-dashed @[30rem]:h-6" />
        <span className="urt-cut absolute top-1/2 left-1/2 flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-destructive">
          <XIcon className="size-2.5" />
        </span>
      </div>
      <div className="flex justify-center">
        <span className="relative h-5 w-px bg-border @[30rem]:h-6">
          <span className="urt-line-tracker absolute inset-0 origin-top bg-primary" />
        </span>
      </div>
    </div>
  );
}

function SupportInbox() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-dashed bg-muted/40 p-2 opacity-60 @[30rem]:p-2.5">
      <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <InboxIcon className="size-3 shrink-0" />
        <span className="truncate text-[10px] font-medium line-through @[30rem]:text-[11px]">
          Support inbox
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="h-1 w-[80%] rounded-full bg-foreground/10" />
        <span className="h-1 w-[60%] rounded-full bg-foreground/10" />
        <span className="h-1 w-[70%] rounded-full bg-foreground/10" />
      </div>
      <span className="mt-auto truncate text-[10px] text-muted-foreground @[30rem]:text-[11px]">
        Not routed here
      </span>
    </div>
  );
}

function TrackerPanel() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border bg-background p-2 shadow-sm @[30rem]:p-2.5">
      <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
        <TrackerChip>
          <GithubIcon className="size-3 shrink-0 text-foreground" />
        </TrackerChip>
        <TrackerChip>
          <LinearIcon className="size-3 shrink-0" />
        </TrackerChip>
        <TrackerChip>
          <JiraIcon className="size-3 shrink-0" />
        </TrackerChip>
        <span className="ml-auto truncate text-[10px] @[30rem]:text-[11px]">
          Issues
        </span>
      </div>

      <div className="urt-issue relative flex min-w-0 flex-col gap-1 rounded-[4px] border bg-background p-1.5">
        <div className="flex min-w-0 items-start gap-1.5">
          <CircleDotIcon className="mt-0.5 size-3 shrink-0 text-success" />
          <p className="line-clamp-2 min-w-0 text-[10px] leading-snug font-medium text-foreground @[30rem]:text-[11px]">
            {TITLE}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 pl-[18px] text-[10px] text-muted-foreground">
          <span className="shrink-0 font-mono">{ISSUE_ID}</span>
          <span className="shrink-0 rounded-[3px] bg-destructive/15 px-1 leading-4 text-destructive">
            bug
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <PaperclipIcon className="size-3 shrink-0" />
            <span className="truncate">5 fields</span>
          </span>
        </div>
        <span className="urt-glow pointer-events-none absolute -inset-px rounded-[4px] ring-2 ring-primary/60 ring-inset" />
      </div>

      <div className="flex shrink-0 flex-col gap-1 rounded-[4px] border p-1.5 opacity-60">
        <span className="h-1 w-[70%] rounded-full bg-foreground/10" />
        <span className="h-1 w-[40%] rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}

type TrackerChipProps = {
  children: ReactNode;
};

function TrackerChip({ children }: TrackerChipProps) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[4px] border bg-muted/40">
      {children}
    </span>
  );
}

// The hand-off: the issue leaves the tracker for the agent over MCP.
function McpConnector() {
  return (
    <div className={cn(COLUMNS, "shrink-0")}>
      <div />
      <div className="relative flex justify-center">
        <span className="relative h-5 w-px bg-border @[30rem]:h-6">
          <span className="urt-line-mcp absolute inset-0 origin-top bg-primary" />
        </span>
        <span className="urt-mcp absolute top-1/2 left-1/2 ml-2 -translate-y-1/2 rounded-full border bg-background px-1.5 font-mono text-[9px] leading-4 text-muted-foreground @[30rem]:text-[10px]">
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

function AgentTerminal() {
  return (
    <TerminalFrame
      title="~/acme"
      contentClassName="dark flex min-w-0 flex-col gap-1 px-2.5 pt-2 pb-2.5 font-mono text-[10px] leading-snug @[30rem]:px-3.5 @[30rem]:pb-3 @[30rem]:text-[11px]"
    >
      <span className="truncate text-muted-foreground/70">
        Claude Code · faster-fixes MCP connected
      </span>

      <TerminalStep step="urt-call">
        <span className="urt-dot shrink-0">⏺</span>
        <span className="min-w-0 truncate text-foreground">
          <span className="font-semibold">faster-fixes - get_feedback</span>{" "}
          <span className="text-muted-foreground">({ISSUE_ID})</span>
        </span>
      </TerminalStep>

      <TerminalStep step="urt-call-out" className="pl-3">
        <span className="shrink-0 text-muted-foreground/60">⎿</span>
        <span className="min-w-0 truncate text-muted-foreground">
          <span className="text-primary">CartTotal</span> · p.cart-total · GET
          422
        </span>
      </TerminalStep>

      <TerminalStep step="urt-read">
        <span className="shrink-0 text-success">⏺</span>
        <span className="min-w-0 truncate text-foreground">
          <span className="font-semibold">Read</span>
          <span className="text-muted-foreground">({COMPONENT_FILE})</span>
        </span>
      </TerminalStep>

      <TerminalStep step="urt-done">
        <span className="shrink-0 text-success">⏺</span>
        <span className="min-w-0 truncate text-success">
          Discount is applied after the total. Fixing.
        </span>
      </TerminalStep>
    </TerminalFrame>
  );
}
