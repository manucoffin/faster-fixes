"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useState, type PointerEvent } from "react";
import { formatFeedbackTime } from "../_helpers/format-timecode";

/** One Feedback on the timeline, coloured by the caller. */
export type VideoTimelineMarker = {
  id: string;
  startMs: number;
  endMs: number | null;
  colorClassName: string;
  /** Drawn above the other markers. */
  raised?: boolean;
};

type VideoTimelineProps = {
  durationMs: number;
  currentMs: number;
  markers: VideoTimelineMarker[];
  activeMarkerId: string | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (markerId: string) => void;
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

// Every marker as a dot (instant) or a bar (range) along the Video. A press on
// the bar seeks, and dragging scrubs.
export function VideoTimeline({
  durationMs,
  currentMs,
  markers,
  activeMarkerId,
  onSeek,
  onMarkerClick,
}: VideoTimelineProps) {
  const [scrubbing, setScrubbing] = useState(false);

  function seekToPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(clamp((event.clientX - rect.left) / rect.width) * durationMs);
  }

  const position = (ms: number) =>
    durationMs ? `${clamp(ms / durationMs) * 100}%` : "0%";

  return (
    <div
      className="relative h-8 w-full cursor-pointer touch-none select-none"
      onPointerDown={(event) => {
        if (!durationMs) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setScrubbing(true);
        seekToPointer(event);
      }}
      onPointerMove={(event) => {
        if (scrubbing) seekToPointer(event);
      }}
      onPointerUp={() => setScrubbing(false)}
      onPointerCancel={() => setScrubbing(false)}
    >
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/30"
          style={{ width: position(currentMs) }}
        />
      </div>

      {markers.map((item) => {
        const isActive = item.id === activeMarkerId;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Comment at ${formatFeedbackTime(item.startMs, item.endMs)}`}
            aria-pressed={isActive}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full transition-transform",
              item.endMs === null
                ? "size-3.5 -translate-x-1/2 ring-2 ring-background hover:scale-125"
                : "h-2 hover:h-2.5",
              item.raised || isActive ? "z-10" : null,
              isActive ? "bg-primary" : item.colorClassName,
            )}
            style={
              item.endMs === null
                ? { left: position(item.startMs) }
                : {
                    left: position(item.startMs),
                    width: `calc(${position(item.endMs)} - ${position(item.startMs)})`,
                  }
            }
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMarkerClick(item.id)}
          />
        );
      })}

      <div
        className="pointer-events-none absolute top-1/2 z-20 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground"
        style={{ left: position(currentMs) }}
      />
    </div>
  );
}
