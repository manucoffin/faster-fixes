import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TerminalFrame } from "../../../../(home)/_features/how-it-works/flow-animations";

const CYCLE = 12;

// Percentages of the cycle at which each terminal line appears. The card
// leaves for its next column on the same beat as the call that moves it.
const PROMPT = 3;
const LIST = 10;
const IN_PROGRESS = 26;
const EDIT = 42;
const RESOLVED = 62;
const RESET = 90;

const LINE_STARTS = [PROMPT, LIST, IN_PROGRESS, EDIT, RESOLVED] as const;
const FADE = 4;
const MOVE = 4;
const CARD_HIDE = 3;

const ZINC_700 = "rgb(63 63 70)";
const INDIGO_400 = "rgb(129 140 248)";
const AMBER_400 = "rgb(251 191 36)";
const EMERALD_400 = "rgb(52 211 153)";
const NO_GLOW = "0 0 0 0 rgb(129 140 248 / 0)";
const READ_GLOW = "0 0 0 3px rgb(129 140 248 / 0.25)";

// Matches the board's `gap-2` between columns.
const COLUMN_GAP = "0.5rem";

const COLUMNS = [
  { label: "New", dot: "bg-indigo-400" },
  { label: "In progress", dot: "bg-amber-400" },
  { label: "Resolved", dot: "bg-emerald-400" },
] as const;

const ARIA_LABEL =
  "Animation showing a coding agent in a terminal listing a new feedback through MCP, marking it in progress, editing the pricing card component, then marking it resolved, while the same feedback card moves from New to In progress to Resolved on the board.";

function columnOffset(column: number) {
  return column === 0
    ? "0"
    : `calc(${column * 100}% + ${column} * ${COLUMN_GAP})`;
}

type CardStop = {
  at: number;
  column: number;
  border: string;
  glow: string;
  opacity: number;
};

const CARD_STOPS: CardStop[] = [
  { at: 0, column: 0, border: ZINC_700, glow: NO_GLOW, opacity: 1 },
  { at: LIST, column: 0, border: ZINC_700, glow: NO_GLOW, opacity: 1 },
  {
    at: LIST + FADE,
    column: 0,
    border: INDIGO_400,
    glow: READ_GLOW,
    opacity: 1,
  },
  { at: IN_PROGRESS, column: 0, border: INDIGO_400, glow: NO_GLOW, opacity: 1 },
  {
    at: IN_PROGRESS + MOVE,
    column: 1,
    border: AMBER_400,
    glow: NO_GLOW,
    opacity: 1,
  },
  { at: RESOLVED, column: 1, border: AMBER_400, glow: NO_GLOW, opacity: 1 },
  {
    at: RESOLVED + MOVE,
    column: 2,
    border: EMERALD_400,
    glow: NO_GLOW,
    opacity: 1,
  },
  { at: RESET, column: 2, border: EMERALD_400, glow: NO_GLOW, opacity: 1 },
  {
    at: RESET + CARD_HIDE,
    column: 2,
    border: EMERALD_400,
    glow: NO_GLOW,
    opacity: 0,
  },
  // Jumps back to New while hidden, then fades in to match the 0% frame.
  {
    at: RESET + CARD_HIDE + 0.1,
    column: 0,
    border: ZINC_700,
    glow: NO_GLOW,
    opacity: 0,
  },
  { at: 100, column: 0, border: ZINC_700, glow: NO_GLOW, opacity: 1 },
];

// The slot is exactly one column wide, so a translateX of 100% plus one gap
// lands on the next column. The card inside it carries the status colours.
function cardKeyframes() {
  const slot = CARD_STOPS.map(
    ({ at, column, opacity }) =>
      `${at}% { transform: translateX(${columnOffset(column)}); opacity: ${opacity}; }`,
  ).join("\n  ");
  const card = CARD_STOPS.map(
    ({ at, border, glow }) =>
      `${at}% { border-color: ${border}; box-shadow: ${glow}; }`,
  ).join("\n  ");
  return `@keyframes wa-mcp-slot {\n  ${slot}\n}\n@keyframes wa-mcp-card {\n  ${card}\n}`;
}

function lineKeyframes() {
  return LINE_STARTS.map(
    (start, i) => `@keyframes wa-mcp-line-${i} {
  0%, ${start}% { opacity: 0; transform: translateX(-4px); }
  ${start + FADE}%, ${RESET}% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(0); }
}
.wa-mcp-line-${i} { opacity: 0; animation: wa-mcp-line-${i} ${CYCLE}s ease infinite; }`,
  ).join("\n");
}

const lineSelectors = LINE_STARTS.map((_, i) => `.wa-mcp-line-${i}`).join(", ");

const styles = `
${lineKeyframes()}
${cardKeyframes()}

@keyframes wa-mcp-check {
  0%, ${RESOLVED + MOVE}% { opacity: 0; transform: scale(0.6); }
  ${RESOLVED + MOVE + 2}%, ${RESET}% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}

.wa-mcp-slot { animation: wa-mcp-slot ${CYCLE}s ease-in-out infinite; }
.wa-mcp-card { animation: wa-mcp-card ${CYCLE}s ease-in-out infinite; }
.wa-mcp-check { opacity: 0; animation: wa-mcp-check ${CYCLE}s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  ${lineSelectors} { animation: none; opacity: 1; transform: none; }
  .wa-mcp-slot { animation: none; transform: translateX(${columnOffset(2)}); }
  .wa-mcp-card { animation: none; border-color: ${EMERALD_400}; }
  .wa-mcp-check { animation: none; opacity: 1; transform: none; }
}
`;

type AgentStepProps = {
  line: number;
  head: ReactNode;
  children: ReactNode;
};

// A tool call in Claude Code's `⏺` / `⎿` layout.
function AgentStep({ line, head, children }: AgentStepProps) {
  return (
    <div className={`wa-mcp-line-${line} flex min-w-0 flex-col gap-0.5`}>
      <div className="flex min-w-0 gap-2">
        <span className="shrink-0 text-emerald-400">⏺</span>
        <span className="min-w-0 text-zinc-200">{head}</span>
      </div>
      <div className="flex min-w-0 gap-2 pl-4">
        <span className="shrink-0 text-zinc-600">⎿</span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      </div>
    </div>
  );
}

type McpCallProps = {
  tool: string;
  args: string;
};

function McpCall({ tool, args }: McpCallProps) {
  return (
    <>
      <span className="text-zinc-500">faster-fixes · </span>
      <span className="font-semibold">{tool}</span>
      <span className="text-zinc-500">{args}</span>
    </>
  );
}

function AgentTerminal() {
  return (
    <TerminalFrame
      title="claude"
      contentClassName="flex flex-col gap-2.5 p-3 font-mono text-[10px] leading-relaxed sm:p-4 sm:text-[11px]"
    >
      <div className="wa-mcp-line-0 flex min-w-0 gap-2 text-zinc-400">
        <span className="shrink-0">&gt;</span>
        <span className="truncate">Fix the new feedback on /pricing</span>
      </div>

      <AgentStep
        line={1}
        head={<McpCall tool="list_feedbacks" args={`(status: "new")`} />}
      >
        <span className="truncate text-zinc-400">
          1 feedback · /pricing · .card:nth-child(2)
        </span>
      </AgentStep>

      <AgentStep
        line={2}
        head={
          <McpCall
            tool="update_feedback_status"
            args={`(status: "in_progress")`}
          />
        }
      >
        <span className="truncate text-amber-400/90">In progress</span>
      </AgentStep>

      <AgentStep
        line={3}
        head={
          <>
            <span className="font-semibold">Edit</span>
            <span className="text-zinc-400">
              (src/components/pricing-card.tsx)
            </span>
          </>
        }
      >
        <span className="truncate rounded-[2px] bg-red-500/10 px-1 text-red-300">
          18 - &lt;div className=&quot;mt-2 flex flex-col&quot;&gt;
        </span>
        <span className="truncate rounded-[2px] bg-emerald-500/10 px-1 text-emerald-300">
          18 + &lt;div className=&quot;flex flex-col&quot;&gt;
        </span>
      </AgentStep>

      <AgentStep
        line={4}
        head={
          <McpCall
            tool="update_feedback_status"
            args={`(status: "resolved")`}
          />
        }
      >
        <span className="truncate text-emerald-400/90">✓ Resolved</span>
      </AgentStep>
    </TerminalFrame>
  );
}

function FeedbackBoard() {
  return (
    <TerminalFrame
      title="Faster Fixes · Board"
      contentClassName="flex flex-col gap-2 p-3 font-mono text-[10px] sm:text-[11px]"
    >
      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map(({ label, dot }) => (
          <div key={label} className="flex min-w-0 items-center gap-1.5 px-1">
            <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="truncate text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map(({ label }) => (
            <div
              key={label}
              className="min-h-[88px] rounded-md border border-zinc-800 bg-zinc-950/60"
            />
          ))}
        </div>

        <div className="wa-mcp-slot absolute inset-y-0 left-0 w-[calc((100%-1rem)/3)] p-1.5">
          <div className="wa-mcp-card flex flex-col gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 p-2">
            <span className="leading-snug text-zinc-200">
              Pricing card sits 8px lower.
            </span>
            <div className="flex items-center justify-between gap-1 text-zinc-500">
              <span className="truncate">/pricing</span>
              <CheckIcon
                className="wa-mcp-check size-3 shrink-0 text-emerald-400"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </TerminalFrame>
  );
}

export function BoardMatchesBranchAnimation() {
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      className="flex w-full flex-col gap-3"
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <AgentTerminal />
      <FeedbackBoard />
    </div>
  );
}
