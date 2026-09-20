"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { TerminalFrame } from "../how-it-works/flow-animations";

const PINS = [
  { x: 14, y: 42, message: "Button too small", file: "header.tsx:12" },
  { x: 50, y: 84, message: "Wrong padding", file: "button.tsx:8" },
] as const;

// Timeline (ms). One full loop = 12000.
// Act 1 (annotate) 0–6.6s · Act 2 (command) 6.6–8.5s · Act 3 (resolve) 8.5–12s
const T = {
  toPin1: 500,
  pin1Click: 700,
  bubble1Start: 1000,
  bubble1End: 1810,
  bubble1Fade: 3000,
  toPin2: 3300,
  pin2Click: 4000,
  bubble2Start: 4200,
  bubble2End: 4785,
  bubble2Fade: 6000,
  exit: 6600,
  cmdStart: 7000,
  cmdEnd: 7810,
  thinkEnd: 8500,
  line1: 8500,
  fix1: 8700,
  bubble1Resolved: 9700,
  line2: 9700,
  fix2: 9900,
  bubble2Resolved: 10900,
  loop: 12000,
};

const CMD = "> fix all feedback";

const ARIA_LABEL =
  "Animation showing a client annotating issues on a website with a cursor, then an AI coding agent fixing each one in a terminal.";

export function HeroFlowAnimation() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <StaticState />;
  return <AnimatedState />;
}

function StaticState() {
  return (
    <div
      className="flex w-full flex-col gap-4"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <TerminalFrame
        title="yourapp.com"
        contentClassName="relative px-4 py-3 h-[220px]"
      >
        <PageBars />
        <Pin x={PINS[0].x} y={PINS[0].y} resolved />
        <Pin x={PINS[1].x} y={PINS[1].y} resolved />
      </TerminalFrame>
      <TerminalFrame title="agent" contentClassName="px-4 py-3 h-[180px]">
        <div className="flex w-full flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <SparklesIcon className="size-3" />
            <span>agent</span>
          </div>
          <div className="text-zinc-200">{CMD}</div>
          <div className="text-zinc-400">→ {PINS[0].file}</div>
          <div className="text-emerald-400">✓ Fixed</div>
          <div className="text-zinc-400">→ {PINS[1].file}</div>
          <div className="text-emerald-400">✓ Fixed</div>
        </div>
      </TerminalFrame>
    </div>
  );
}

function AnimatedState() {
  const elapsed = useElapsed(T.loop, 50);

  const cursorPos = (() => {
    if (elapsed < T.toPin1) {
      return lerp({ x: 92, y: 92 }, PINS[0], elapsed / T.toPin1);
    }
    if (elapsed < T.bubble1Fade) return PINS[0];
    if (elapsed < T.toPin2) {
      return lerp(
        PINS[0],
        PINS[1],
        (elapsed - T.bubble1Fade) / (T.toPin2 - T.bubble1Fade),
      );
    }
    if (elapsed < T.bubble2Fade) return PINS[1];
    if (elapsed < T.exit) {
      return lerp(
        PINS[1],
        { x: 92, y: 92 },
        (elapsed - T.bubble2Fade) / (T.exit - T.bubble2Fade),
      );
    }
    return null;
  })();

  const showClickRing1 = elapsed >= T.pin1Click && elapsed < T.pin1Click + 400;
  const showClickRing2 = elapsed >= T.pin2Click && elapsed < T.pin2Click + 400;
  const pin1Visible = elapsed >= T.pin1Click;
  const pin2Visible = elapsed >= T.pin2Click;
  const pin1Resolved = elapsed >= T.fix1;
  const pin2Resolved = elapsed >= T.fix2;

  const bubble1Text = typedSubstring(
    PINS[0].message,
    T.bubble1Start,
    T.bubble1End,
    elapsed,
  );
  const bubble2Text = typedSubstring(
    PINS[1].message,
    T.bubble2Start,
    T.bubble2End,
    elapsed,
  );
  const bubble1Visible = elapsed >= T.bubble1Start && elapsed < T.bubble1Fade;
  const bubble2Visible = elapsed >= T.bubble2Start && elapsed < T.bubble2Fade;
  const bubble1ResolvedVisible =
    elapsed >= T.fix1 && elapsed < T.bubble1Resolved;
  const bubble2ResolvedVisible =
    elapsed >= T.fix2 && elapsed < T.bubble2Resolved;

  const cmdText = typedSubstring(CMD, T.cmdStart, T.cmdEnd, elapsed);
  const showCaret = elapsed >= T.exit && elapsed < T.cmdEnd + 100;
  const showThinking = elapsed >= T.cmdEnd && elapsed < T.thinkEnd;
  const agentActive = elapsed >= T.exit && elapsed < T.fix2 + 400;

  return (
    <div
      className="flex w-full flex-col gap-4"
      role="img"
      aria-label={ARIA_LABEL}
    >
      <style dangerouslySetInnerHTML={{ __html: heroAnimStyles }} />
      <TerminalFrame
        title="yourapp.com"
        contentClassName="relative px-4 py-3 h-[220px]"
      >
        <PageBars />
        {pin1Visible && (
          <Pin
            x={PINS[0].x}
            y={PINS[0].y}
            resolved={pin1Resolved}
            showRing={showClickRing1}
          />
        )}
        {pin2Visible && (
          <Pin
            x={PINS[1].x}
            y={PINS[1].y}
            resolved={pin2Resolved}
            showRing={showClickRing2}
          />
        )}
        {bubble1Visible && (
          <Bubble x={PINS[0].x} y={PINS[0].y} text={bubble1Text} />
        )}
        {bubble2Visible && (
          <Bubble x={PINS[1].x} y={PINS[1].y} text={bubble2Text} />
        )}
        {bubble1ResolvedVisible && (
          <Bubble
            x={PINS[0].x}
            y={PINS[0].y}
            text={`✓ ${PINS[0].file}`}
            resolved
          />
        )}
        {bubble2ResolvedVisible && (
          <Bubble
            x={PINS[1].x}
            y={PINS[1].y}
            text={`✓ ${PINS[1].file}`}
            resolved
          />
        )}
        {cursorPos && <Cursor x={cursorPos.x} y={cursorPos.y} />}
      </TerminalFrame>

      <TerminalFrame title="agent" contentClassName="px-4 py-3 h-[180px]">
        <div className="flex w-full flex-col gap-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <SparklesIcon
              className={`size-3 ${agentActive ? "hfa-sparkles text-zinc-300" : ""}`}
            />
            <span>agent</span>
          </div>
          <div className="text-zinc-200">
            {cmdText}
            {showCaret && <span className="hfa-caret">▍</span>}
            {showThinking && (
              <span className="ml-1 text-zinc-500">
                <span className="hfa-dot">.</span>
                <span className="hfa-dot hfa-dot-2">.</span>
                <span className="hfa-dot hfa-dot-3">.</span>
              </span>
            )}
          </div>
          {elapsed >= T.line1 && (
            <div className="text-zinc-400">→ {PINS[0].file}</div>
          )}
          {elapsed >= T.fix1 && <div className="text-emerald-400">✓ Fixed</div>}
          {elapsed >= T.line2 && (
            <div className="text-zinc-400">→ {PINS[1].file}</div>
          )}
          {elapsed >= T.fix2 && <div className="text-emerald-400">✓ Fixed</div>}
        </div>
      </TerminalFrame>
    </div>
  );
}

const COLLABORATOR = { name: "Marie, CEO", color: "#ec4899" }; // pink-500

function Cursor({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20 transition-[left,top] duration-75 ease-out"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow">
        <path
          d="M2 2 L2 15.5 L5.8 11.8 L9 18 L11.6 17 L8.5 10.8 L14.5 10 Z"
          fill={COLLABORATOR.color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute top-[16px] left-[14px] rounded-[4px] px-1.5 py-0.5 font-sans text-[10px] font-medium whitespace-nowrap text-white shadow-sm"
        style={{ backgroundColor: COLLABORATOR.color }}
      >
        {COLLABORATOR.name}
      </span>
    </div>
  );
}

function Pin({
  x,
  y,
  resolved,
  showRing,
}: {
  x: number;
  y: number;
  resolved: boolean;
  showRing?: boolean;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: "hfa-pin-appear 300ms ease-out forwards",
      }}
    >
      {showRing && (
        <span
          className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/60"
          style={{ animation: "hfa-ring 400ms ease-out forwards" }}
        />
      )}
      <div
        className={`flex size-3 items-center justify-center rounded-full transition-colors duration-300 ${
          resolved ? "bg-emerald-400" : "bg-amber-400"
        }`}
        style={{
          boxShadow: resolved
            ? "0 0 6px rgb(52 211 153 / 0.5)"
            : "0 0 6px rgb(251 191 36 / 0.4)",
        }}
      >
        {resolved && <CheckIcon className="size-2.5 text-zinc-900" />}
      </div>
    </div>
  );
}

function Bubble({
  x,
  y,
  text,
  resolved,
}: {
  x: number;
  y: number;
  text: string;
  resolved?: boolean;
}) {
  return (
    <div
      className={`absolute z-10 rounded border px-2 py-1 whitespace-nowrap ${
        resolved
          ? "border-emerald-700/50 bg-emerald-950/80"
          : "border-zinc-700 bg-zinc-800"
      }`}
      style={{ left: `calc(${x}% + 14px)`, top: `calc(${y}% - 10px)` }}
    >
      <p
        className={`font-mono text-[10px] ${
          resolved ? "text-emerald-300" : "text-zinc-300"
        }`}
      >
        {text}
        {!resolved && text.length > 0 && <span className="hfa-caret">▍</span>}
      </p>
    </div>
  );
}

function PageBars() {
  return (
    <div className="flex h-full flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 pb-2">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-sm bg-zinc-600" />
          <div className="h-1 w-5 rounded-[2px] bg-zinc-700" />
          <div className="h-1 w-5 rounded-[2px] bg-zinc-800" />
          <div className="h-1 w-5 rounded-[2px] bg-zinc-800" />
          <div className="h-1 w-5 rounded-[2px] bg-zinc-800" />
        </div>
        <div className="h-3 w-10 rounded-sm border border-zinc-700 bg-zinc-800" />
      </div>

      {/* Hero */}
      <div className="mt-3 flex flex-col gap-1.5">
        <div className="h-2.5 w-[55%] rounded-[2px] bg-zinc-600" />
        <div className="h-2.5 w-[35%] rounded-[2px] bg-zinc-600" />
        <div className="mt-1 h-1 w-[70%] rounded-[2px] bg-zinc-800/60" />
        <div className="h-1 w-[55%] rounded-[2px] bg-zinc-800/60" />
        {/* CTA — PIN 1 lands here */}
        <div className="mt-1 flex h-4 w-16 items-center justify-center rounded-sm bg-zinc-700">
          <div className="h-1 w-8 rounded-[1px] bg-zinc-500" />
        </div>
      </div>

      {/* Feature cards */}
      <div className="mt-auto grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded border border-zinc-800 bg-zinc-900/60 p-1.5"
          >
            <div className="size-2 rounded-sm bg-zinc-700" />
            <div className="h-1 w-[70%] rounded-[2px] bg-zinc-700" />
            <div className="h-[3px] w-full rounded-[1px] bg-zinc-800/70" />
            <div className="h-[3px] w-[80%] rounded-[1px] bg-zinc-800/70" />
            {/* mini-button — PIN 2 lands on the middle card's button */}
            <div className="mt-0.5 h-2 w-7 rounded-[2px] bg-zinc-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function typedSubstring(
  text: string,
  startMs: number,
  endMs: number,
  elapsed: number,
) {
  if (elapsed < startMs) return "";
  if (elapsed >= endMs) return text;
  const pct = (elapsed - startMs) / (endMs - startMs);
  return text.slice(0, Math.ceil(text.length * pct));
}

function lerp(
  a: { x: number; y: number },
  b: { x: number; y: number },
  p: number,
) {
  const e = 1 - Math.pow(1 - Math.min(Math.max(p, 0), 1), 2); // easeOut
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
}

function useElapsed(loopMs: number, tickMs: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let id = 0;
    const tick = () => {
      setElapsed((performance.now() - start) % loopMs);
      id = window.setTimeout(tick, tickMs);
    };
    tick();
    return () => clearTimeout(id);
  }, [loopMs, tickMs]);
  return elapsed;
}

const heroAnimStyles = `
@keyframes hfa-pin-appear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  60% { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
@keyframes hfa-ring {
  0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
}
@keyframes hfa-sparkles-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.hfa-sparkles { animation: hfa-sparkles-pulse 1.6s ease-in-out infinite; }
.hfa-caret { display: inline-block; animation: hfa-blink 800ms steps(1) infinite; margin-left: 1px; }
@keyframes hfa-blink { 50% { opacity: 0; } }
.hfa-dot { opacity: 0.3; animation: hfa-pulse 1s infinite; }
.hfa-dot-2 { animation-delay: 0.15s; }
.hfa-dot-3 { animation-delay: 0.3s; }
@keyframes hfa-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
`;
