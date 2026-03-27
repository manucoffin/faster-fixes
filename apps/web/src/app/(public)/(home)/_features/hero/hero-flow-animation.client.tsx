"use client";

import { useEffect, useState } from "react";
import { TerminalFrame } from "../how-it-works/flow-animations";

const STEP_DURATION = 2800;

const FEEDBACKS = [
  {
    x: "22%",
    y: "14%",
    message: "Fix this button",
    file: "header.tsx:12",
    bubbleDir: "right" as const,
  },
  {
    x: "62%",
    y: "44%",
    message: "Wrong color",
    file: "panel.tsx:24",
    bubbleDir: "left" as const,
  },
  {
    x: "38%",
    y: "74%",
    message: "Align this text",
    file: "button.tsx:8",
    bubbleDir: "right" as const,
  },
];

const heroStyles = `
@keyframes hfa-vbeam {
  0% { top: -3px; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: calc(100% + 2px); opacity: 0; }
}

@keyframes hfa-pin-appear {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes hfa-pin-fade {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.5); }
}

@keyframes hfa-bubble {
  0% { opacity: 0; transform: translateY(4px) scale(0.92); }
  12% { opacity: 1; transform: translateY(0) scale(1); }
  55% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-2px) scale(0.96); }
}

@keyframes hfa-term-line {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

export function HeroFlowAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setStep((s) => s + 1), STEP_DURATION);
    return () => clearTimeout(timeout);
  }, [step]);

  const len = FEEDBACKS.length;
  const currentIdx = step % len;
  const prevIdx = (step - 1 + len) % len;
  const fadingIdx = (step - 2 + len) % len;

  const pins: {
    step: number;
    idx: number;
    state: "current" | "resolved" | "fading";
  }[] = [{ step, idx: currentIdx, state: "current" }];
  if (step > 0) pins.push({ step: step - 1, idx: prevIdx, state: "resolved" });
  if (step > 1) pins.push({ step: step - 2, idx: fadingIdx, state: "fading" });

  const current = FEEDBACKS[currentIdx]!;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroStyles }} />
      <div className="flex w-full flex-col gap-3">
        {/* Browser mockup */}
        <TerminalFrame
          title="yourapp.com"
          contentClassName="relative px-4 py-3 h-[160px]"
        >
          {/* Page content bars */}
          <div className="flex flex-col gap-2">
            <div className="h-2 w-[65%] rounded-[2px] bg-zinc-800" />
            <div className="h-1.5 w-full rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[85%] rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[55%] rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[75%] rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[45%] rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[70%] rounded-[2px] bg-zinc-800/50" />
            <div className="h-1.5 w-[55%] rounded-[2px] bg-zinc-800/50" />
          </div>

          {/* Feedback pins */}
          {pins.map((pin) => {
            const fb = FEEDBACKS[pin.idx]!;
            return (
              <div
                key={pin.step}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: fb.x,
                  top: fb.y,
                  animation:
                    pin.state === "current"
                      ? "hfa-pin-appear 300ms ease-out forwards"
                      : pin.state === "fading"
                        ? "hfa-pin-fade 800ms ease-out forwards"
                        : undefined,
                }}
              >
                {/* Dot */}
                <div
                  className={`size-3 rounded-full transition-colors duration-500 ${
                    pin.state === "current" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{
                    boxShadow:
                      pin.state === "current"
                        ? "0 0 6px rgb(251 191 36 / 0.4)"
                        : "0 0 6px rgb(52 211 153 / 0.4)",
                  }}
                />
                {/* Feedback bubble */}
                {pin.state === "current" && (
                  <div
                    className={`absolute -top-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 whitespace-nowrap ${
                      fb.bubbleDir === "left" ? "right-5" : "left-5"
                    }`}
                    style={{ animation: "hfa-bubble 1.8s ease-out forwards" }}
                  >
                    <p className="font-mono text-[9px] text-zinc-400">
                      {fb.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </TerminalFrame>

        {/* Vertical beam connector area */}
        <div className="relative mx-4 h-10">
          {FEEDBACKS.map((f, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-zinc-800"
              style={{ left: f.x }}
            />
          ))}
          <div
            key={`beam-${step}`}
            className="absolute size-1.5 -translate-x-1/2 rounded-full bg-indigo-400/80"
            style={{
              left: current.x,
              animation: "hfa-vbeam 600ms ease-in-out forwards",
              boxShadow: "0 0 6px rgb(129 140 248 / 0.5)",
            }}
          />
        </div>

        {/* Terminal */}
        <TerminalFrame title="terminal" contentClassName="px-4 py-3 h-[120px]">
          <div className="flex w-full flex-col gap-1.5 font-mono text-[11px]">
            <div className="text-emerald-400/80">$ fix-feedback --all</div>
            <div key={step} className="flex flex-col gap-1.5">
              <div
                className="text-zinc-500"
                style={{
                  opacity: 0,
                  animation: "hfa-term-line 250ms ease-out 0.7s both",
                }}
              >
                {"\u2192 " + current.file}
              </div>
              <div
                className="text-emerald-400/70"
                style={{
                  opacity: 0,
                  animation: "hfa-term-line 250ms ease-out 1.2s both",
                }}
              >
                {"\u2713 Fixed"}
              </div>
            </div>
          </div>
        </TerminalFrame>
      </div>
    </>
  );
}
