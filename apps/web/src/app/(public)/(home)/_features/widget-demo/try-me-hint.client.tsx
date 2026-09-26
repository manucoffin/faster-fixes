"use client";

import { ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

const APPEAR_DELAY_MS = 2500;

const tryMeStyles = `
@keyframes ff-try-me-spin {
  to { transform: rotate(360deg); }
}
@keyframes ff-try-me-fade-in {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

/**
 * Marketing hint that nudges visitors toward the widget's floating button.
 * Lives outside the widget package — pure marketing code. Renders nothing
 * on touch devices (mobile users discover the floating button by tapping
 * it; the hint adds clutter in a tight viewport).
 */
export function TryMeHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    const showTimer = window.setTimeout(
      () => setVisible(true),
      APPEAR_DELAY_MS,
    );

    // First interaction with the Widget host dismisses the hint forever. The
    // Widget hides pointerdown from the page, so listen for pointerup.
    const dismiss = (e: PointerEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest("[data-ff-widget]")) {
        setVisible(false);
        document.removeEventListener("pointerup", dismiss, true);
      }
    };
    document.addEventListener("pointerup", dismiss, true);

    return () => {
      window.clearTimeout(showTimer);
      document.removeEventListener("pointerup", dismiss, true);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{tryMeStyles}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[80px] bottom-[22px] z-[2147483646] animate-[ff-try-me-fade-in_320ms_ease-out_both]"
      >
        <div className="relative overflow-hidden rounded-full bg-primary p-[2px] shadow-lg">
          <div
            className="absolute inset-[-50%] animate-[ff-try-me-spin_3s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 60deg, color-mix(in oklch, var(--primary) 30%, white) 90deg, transparent 120deg, transparent 360deg)",
            }}
          />
          <div className="relative flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground">
            Try me
            <ChevronRightIcon className="size-3.5" />
          </div>
        </div>
      </div>
    </>
  );
}
