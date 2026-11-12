import { CameraIcon, MousePointer2Icon } from "lucide-react";
import { TerminalFrame } from "../how-it-works/flow-animations";

const CYCLE = 9;

// Percentages of the cycle. The cursor reaches the button at SELECTION, where
// the Recording ends and the Screenshot is taken.
const SELECTION = 70;
const RESET = 95;

// Where the cursor clicks the Pay button, as percentages of the mock page.
const SELECTION_POINT = { x: 68, y: 66 };

// Cursor stops, as percentages of the mock page, and the cycle percentage at
// which the cursor arrives. A stop with `click` shows a ripple on arrival.
const CURSOR_PATH = [
  { at: 0, x: 18, y: 84, click: false },
  { at: 20, x: 74, y: 7, click: true },
  { at: 42, x: 26, y: 46, click: false },
  { at: SELECTION, ...SELECTION_POINT, click: true },
] as const;

const BUTTON = { x: 52, y: 58, width: 34, height: 14 };

const HUMAN_ARIA_LABEL =
  "Animation showing a cursor moving through a checkout page while the last minute is recorded, ending on the Pay button, which is outlined on the screenshot.";

const AGENT_ARIA_LABEL =
  "Animation showing a coding agent fetching a feedback through MCP, reading its console error, failed network request and React component path, then fixing it.";

function cursorKeyframes() {
  const stops = CURSOR_PATH.map(
    ({ at, x, y }) => `${at}% { left: ${x}%; top: ${y}%; }`,
  ).join("\n  ");
  return `@keyframes ctx-cursor {\n  ${stops}\n  100% { left: ${SELECTION_POINT.x}%; top: ${SELECTION_POINT.y}%; }\n}`;
}

function rippleKeyframes() {
  return CURSOR_PATH.filter(({ click }) => click)
    .map(
      ({ at }, i) => `@keyframes ctx-ripple-${i} {
  0%, ${at - 0.5}% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  ${at}% { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
  ${at + 6}%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
}
.ctx-ripple-${i} { opacity: 0; animation: ctx-ripple-${i} ${CYCLE}s ease-out infinite; }`,
    )
    .join("\n");
}

// The agent's lines appear one after the other and all stay until the reset.
const AGENT_LINE_COUNT = 7;

function agentLineKeyframes() {
  return Array.from({ length: AGENT_LINE_COUNT }, (_, i) => {
    const start = 4 + i * 10;
    return `@keyframes ctx-agent-line-${i} {
  0%, ${start}% { opacity: 0; transform: translateX(-4px); }
  ${start + 4}%, ${RESET}% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(0); }
}
.ctx-agent-line-${i} { opacity: 0; animation: ctx-agent-line-${i} ${CYCLE}s ease infinite; }`;
  }).join("\n");
}

const styles = `
${cursorKeyframes()}
${rippleKeyframes()}
${agentLineKeyframes()}

@keyframes ctx-playhead {
  0% { left: 0%; }
  ${SELECTION}%, 100% { left: 100%; }
}

@keyframes ctx-captured {
  0%, ${SELECTION}% { opacity: 0; transform: translateY(4px); }
  ${SELECTION + 4}%, ${RESET}% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
}

@keyframes ctx-flash {
  0%, ${SELECTION}% { opacity: 0; }
  ${SELECTION + 1}% { opacity: 0.35; }
  ${SELECTION + 5}%, 100% { opacity: 0; }
}

.ctx-cursor { animation: ctx-cursor ${CYCLE}s ease-in-out infinite; }
.ctx-playhead { animation: ctx-playhead ${CYCLE}s linear infinite; }
.ctx-captured { opacity: 0; animation: ctx-captured ${CYCLE}s ease-out infinite; }
.ctx-flash { opacity: 0; animation: ctx-flash ${CYCLE}s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ctx-cursor { animation: none; left: ${SELECTION_POINT.x}%; top: ${SELECTION_POINT.y}%; }
  .ctx-playhead { animation: none; left: 100%; }
  .ctx-captured { animation: none; opacity: 1; }
  .ctx-flash { animation: none; opacity: 0; }
  ${Array.from({ length: AGENT_LINE_COUNT }, (_, i) => `.ctx-agent-line-${i}`).join(", ")} { animation: none; opacity: 1; }
  ${CURSOR_PATH.filter(({ click }) => click)
    .map((_, i) => `.ctx-ripple-${i}`)
    .join(", ")} { animation: none; opacity: 0; }
}
`;

export function ContextIllustrationStyles() {
  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}

export function HumanContextIllustration() {
  return (
    <div role="img" aria-label={HUMAN_ARIA_LABEL}>
      <TerminalFrame
        title="yourapp.com/checkout"
        contentClassName="flex flex-col gap-3 p-3"
      >
        <MockPage />
        <RecordingTimeline />
      </TerminalFrame>
    </div>
  );
}

function MockPage() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-zinc-950">
      {/* Navigation */}
      <div className="absolute inset-x-0 top-0 flex h-[14%] items-center gap-[4%] border-b border-zinc-800 px-[6%]">
        <span className="h-[30%] w-[12%] rounded-[2px] bg-zinc-700" />
        <span className="ml-auto h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
        <span className="h-[22%] w-[9%] rounded-[2px] bg-zinc-800" />
      </div>

      {/* Product */}
      <div className="absolute top-[24%] left-[8%] h-[52%] w-[36%] rounded-md bg-zinc-800/80" />
      <div className="absolute top-[26%] left-[52%] h-[7%] w-[36%] rounded-[2px] bg-zinc-700" />
      <div className="absolute top-[38%] left-[52%] h-[4%] w-[30%] rounded-[2px] bg-zinc-800" />
      <div className="absolute top-[46%] left-[52%] h-[4%] w-[24%] rounded-[2px] bg-zinc-800" />

      {/* Pay button */}
      <div
        className="absolute flex items-center justify-center rounded-[4px] bg-zinc-200"
        style={{
          left: `${BUTTON.x}%`,
          top: `${BUTTON.y}%`,
          width: `${BUTTON.width}%`,
          height: `${BUTTON.height}%`,
        }}
      >
        <span className="text-[10px] font-semibold text-zinc-900">Pay $49</span>
      </div>

      {/* Selection frame, drawn once the Screenshot is taken */}
      <div
        className="ctx-captured absolute rounded-[6px] border-2 border-dashed border-indigo-400/90 bg-indigo-400/10"
        style={{
          left: `${BUTTON.x - 2}%`,
          top: `${BUTTON.y - 4}%`,
          width: `${BUTTON.width + 4}%`,
          height: `${BUTTON.height + 8}%`,
        }}
      />

      <div className="ctx-flash absolute inset-0 bg-white" />

      <div className="ctx-captured absolute top-[84%] left-[52%] flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/95 px-2 py-0.5">
        <CameraIcon className="size-2.5 text-zinc-400" />
        <span className="font-mono text-[9px] text-zinc-300">
          Screenshot captured
        </span>
      </div>

      {CURSOR_PATH.filter(({ click }) => click).map(({ x, y }, i) => (
        <span
          key={`${x}-${y}`}
          className={`ctx-ripple-${i} absolute size-6 rounded-full border-2 border-indigo-400/80`}
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      <MousePointer2Icon className="ctx-cursor absolute size-4 fill-zinc-100 text-zinc-900" />
    </div>
  );
}

function RecordingTimeline() {
  const clickPositions = CURSOR_PATH.filter(({ click }) => click).map(
    ({ at }) => (at / SELECTION) * 100,
  );

  return (
    <div className="flex items-center gap-3 px-1">
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-zinc-400">
        <span className="size-1.5 rounded-full bg-red-400" />
        Recording
      </span>
      <div className="relative h-1 flex-1 rounded-full bg-zinc-800">
        {clickPositions.map((left) => (
          <span
            key={left}
            className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400"
            style={{ left: `${left}%` }}
          />
        ))}
        <span className="ctx-playhead absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
      </div>
      <span className="shrink-0 font-mono text-[10px] text-zinc-500">
        Last minute
      </span>
    </div>
  );
}

const AGENT_LINES = [
  {
    label: ">",
    value: "Fix the open feedback on /checkout",
    labelClassName: "text-indigo-400",
    valueClassName: "text-zinc-200",
  },
  {
    label: "mcp",
    value: 'get_feedback · "Pay button does nothing"',
    labelClassName: "text-zinc-600",
    valueClassName: "text-emerald-400/80",
  },
  {
    label: "console",
    value: "TypeError: cart.total is undefined",
    labelClassName: "text-zinc-600",
    valueClassName: "text-red-400",
  },
  {
    label: "network",
    value: "POST /api/checkout · 500 · 182ms",
    labelClassName: "text-zinc-600",
    valueClassName: "text-red-400",
  },
  {
    label: "react",
    value: "<Checkout> <PaymentForm> <PayButton>",
    labelClassName: "text-zinc-600",
    valueClassName: "text-indigo-300",
  },
  {
    label: "source",
    value: "src/checkout/pay-button.tsx:42",
    labelClassName: "text-zinc-600",
    valueClassName: "text-zinc-400",
  },
  {
    label: "✓",
    value: "Fixed pay-button.tsx, feedback resolved",
    labelClassName: "text-emerald-400/80",
    valueClassName: "text-emerald-400/80",
  },
] as const;

export function AgentContextIllustration() {
  return (
    <div role="img" aria-label={AGENT_ARIA_LABEL}>
      <TerminalFrame
        title="terminal"
        contentClassName="flex flex-col gap-2.5 px-4 py-4"
      >
        {AGENT_LINES.map((line, i) => (
          <div
            key={line.label}
            className={`ctx-agent-line-${i} flex min-w-0 gap-2.5 font-mono text-[11px]`}
          >
            <span className={`w-12 shrink-0 text-right ${line.labelClassName}`}>
              {line.label}
            </span>
            <span className={`truncate ${line.valueClassName}`}>
              {line.value}
            </span>
          </div>
        ))}
      </TerminalFrame>
    </div>
  );
}
