"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TerminalFrame } from "../how-it-works/flow-animations";

type ChatMessage = { text: string; isImage?: boolean };

type Phase = {
  messages: ChatMessage[];
  card: {
    title: string;
    description: string;
  };
};

const phases: Phase[] = [
  {
    messages: [
      { text: "can you check the pricing page?" },
      { text: "something's off with the button I think" },
      { text: "can you just make it look right" },
    ],
    card: {
      title: "The vague instruction",
      description:
        '"Can you make it pop a bit more?" No element, no expected behavior, no definition of done.',
    },
  },
  {
    messages: [
      { text: "screenshot.jpg", isImage: true },
      { text: "see? right there (sorry took it from my phone)" },
    ],
    card: {
      title: "The blurry screenshot",
      description:
        "Taken on a phone, cropped, no URL bar. You cannot tell which page, which breakpoint, or which state.",
    },
  },
  {
    messages: [
      { text: "oh and also:" },
      {
        text: "1. footer link broken\n2. font too small on mobile\n3. logo blurry\n4. need contact form\n5. carousel doesn't work\n6. colors feel off\n7. try different hero layout",
      },
    ],
    card: {
      title: "The dump message",
      description:
        "One message. Twelve separate requests. No priority, no scope. You spend more time untangling it than fixing half of them.",
    },
  },
];

const allMessages = phases.flatMap((phase, phaseIndex) =>
  phase.messages.map((msg) => ({ ...msg, phaseIndex })),
);

// --- scroll-driven progress ---

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // mobile: show everything immediately
    if (!isDesktop) {
      setProgress(1);
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!ref.current) {
          ticking = false;
          return;
        }
        const rect = ref.current.getBoundingClientRect();
        const scrollable = ref.current.offsetHeight - window.innerHeight;
        if (scrollable <= 0) {
          ticking = false;
          return;
        }
        setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, isDesktop]);

  return progress;
}

// --- component ---

export function ProblemChatAnimation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // messages fill across 0–85 % of scroll, last 15 % is breathing room
  const msgProgress = Math.min(progress / 0.85, 1);
  const visibleCount = Math.floor(msgProgress * (allMessages.length + 0.5));

  // card appears when its first message becomes visible
  const activePhase = (() => {
    let idx = 0;
    let active = -1;
    for (let p = 0; p < phases.length; p++) {
      if (visibleCount > idx) active = p;
      idx += phases[p]!.messages.length;
    }
    return active;
  })();

  return (
    <div ref={sectionRef} className="relative md:h-[250vh]">
      <div className="py-8 md:sticky md:top-0 md:flex md:h-screen md:items-center md:py-0">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 md:grid-cols-2">
            {/* ── chat panel ── */}
            <TerminalFrame
              title="Client"
              contentClassName="flex flex-col gap-2.5 p-4"
            >
              {allMessages.map((msg, i) => {
                const show = !mounted || i < visibleCount;
                return (
                  <div
                    key={i}
                    className="transition-all duration-500 ease-out"
                    style={{
                      opacity: show ? 1 : 0,
                      transform: show ? "translateY(0)" : "translateY(8px)",
                    }}
                  >
                    {msg.isImage ? (
                      <div className="inline-block rounded-lg rounded-tl-sm border border-zinc-700/50 bg-zinc-800 px-3 py-2.5">
                        <div className="flex h-14 w-28 items-center justify-center rounded bg-zinc-700/30">
                          <ImageIcon className="size-5 text-zinc-600" />
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          screenshot.jpg
                        </p>
                      </div>
                    ) : (
                      <div className="inline-block max-w-[85%] rounded-lg rounded-tl-sm border border-zinc-700/50 bg-zinc-800 px-3 py-2">
                        <p className="text-[13px] leading-relaxed whitespace-pre-line text-zinc-400">
                          {msg.text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </TerminalFrame>

            {/* ── cards — fade in one by one as messages progress ── */}
            <div className="flex flex-col gap-4">
              <p className="text-lg font-medium">Does this sound familiar?</p>
              {phases.map((phase, i) => {
                const show = !mounted || i <= activePhase;
                return (
                  <div
                    key={phase.card.title}
                    className="bg-background rounded-xl border p-7 transition-all duration-500 ease-out"
                    style={{
                      opacity: show ? 1 : 0,
                      transform: show ? "translateY(0)" : "translateY(12px)",
                    }}
                  >
                    <h3 className="text-lg font-semibold">
                      {phase.card.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                      {phase.card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
