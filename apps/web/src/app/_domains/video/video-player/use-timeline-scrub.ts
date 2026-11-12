import { useState, type PointerEvent } from "react";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Pointer handlers for a timeline bar: a press seeks to the pointer, and
 * dragging scrubs until the pointer is released.
 */
export function useTimelineScrub(
  durationMs: number,
  onSeek: (ms: number) => void,
) {
  const [scrubbing, setScrubbing] = useState(false);

  function seekToPointer(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(clamp((event.clientX - rect.left) / rect.width) * durationMs);
  }

  return {
    position: (ms: number) =>
      durationMs ? `${clamp(ms / durationMs) * 100}%` : "0%",
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!durationMs) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setScrubbing(true);
        seekToPointer(event);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (scrubbing) seekToPointer(event);
      },
      onPointerUp: () => setScrubbing(false),
      onPointerCancel: () => setScrubbing(false),
    },
  };
}
