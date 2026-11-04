"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useState, type PointerEvent } from "react";
import type { FeedbackStatus, VideoSelection } from "./use-video-review";

type TimelineMarker = {
  id: string;
  startMs: number;
  endMs: number | null;
  status: FeedbackStatus;
  isOwn: boolean;
};

type TimelineProps = {
  durationMs: number;
  currentMs: number;
  markers: TimelineMarker[];
  draft: VideoSelection | null;
  activeId: string | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (id: string) => void;
  /** When set, dragging along the bar marks an in and an out point. */
  onRangeDrag?: (startMs: number, endMs: number) => void;
  thick?: boolean;
  className?: string;
};

type Drag = { startMs: number; currentMs: number };

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function markerColor(marker: TimelineMarker, isActive: boolean) {
  if (isActive) return "bg-primary";
  if (marker.status === "resolved") return "bg-success";
  return marker.isOwn ? "bg-foreground" : "bg-foreground/60";
}

export function Timeline({
  durationMs,
  currentMs,
  markers,
  draft,
  activeId,
  onSeek,
  onMarkerClick,
  onRangeDrag,
  thick = false,
  className,
}: TimelineProps) {
  const [drag, setDrag] = useState<Drag | null>(null);

  function toMs(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / rect.width) * durationMs;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!durationMs) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ms = toMs(event);
    setDrag({ startMs: ms, currentMs: ms });
    if (!onRangeDrag) onSeek(ms);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const ms = toMs(event);
    setDrag({ startMs: drag.startMs, currentMs: ms });
    if (!onRangeDrag) onSeek(ms);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const ms = toMs(event);
    setDrag(null);
    if (!onRangeDrag) return;
    const moved = Math.abs(ms - drag.startMs) > durationMs * 0.01;
    if (moved) {
      onRangeDrag(Math.min(drag.startMs, ms), Math.max(drag.startMs, ms));
    } else {
      onSeek(ms);
    }
  }

  const position = (ms: number) =>
    durationMs ? `${clamp(ms / durationMs) * 100}%` : "0%";

  const rangeDrag =
    drag && onRangeDrag && Math.abs(drag.currentMs - drag.startMs) > 0
      ? {
          startMs: Math.min(drag.startMs, drag.currentMs),
          endMs: Math.max(drag.startMs, drag.currentMs),
        }
      : null;

  return (
    <div
      className={cn(
        "relative w-full touch-none select-none",
        thick ? "h-12" : "h-8",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-muted",
          thick ? "h-3" : "h-1.5",
        )}
      >
        <div
          className="h-full rounded-full bg-foreground/40"
          style={{ width: position(currentMs) }}
        />
      </div>

      {markers.map((marker) => {
        const color = markerColor(marker, marker.id === activeId);
        return marker.endMs !== null ? (
          <button
            key={marker.id}
            type="button"
            className={cn(
              "absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-90 hover:opacity-100",
              thick && "h-3",
              color,
            )}
            style={{
              left: position(marker.startMs),
              width: `calc(${position(marker.endMs)} - ${position(marker.startMs)})`,
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMarkerClick(marker.id)}
            aria-label="Open comment"
          />
        ) : (
          <button
            key={marker.id}
            type="button"
            className={cn(
              "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background hover:scale-125",
              thick && "size-4",
              color,
            )}
            style={{ left: position(marker.startMs) }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMarkerClick(marker.id)}
            aria-label="Open comment"
          />
        );
      })}

      {draft && draft.endMs !== null ? (
        <div
          className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-primary/60 ring-2 ring-primary"
          style={{
            left: position(draft.startMs),
            width: `calc(${position(draft.endMs)} - ${position(draft.startMs)})`,
          }}
        />
      ) : null}
      {draft && draft.endMs === null ? (
        <div
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
          style={{ left: position(draft.startMs) }}
        />
      ) : null}

      {rangeDrag ? (
        <div
          className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-primary/40 ring-2 ring-primary"
          style={{
            left: position(rangeDrag.startMs),
            width: `calc(${position(rangeDrag.endMs)} - ${position(rangeDrag.startMs)})`,
          }}
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute top-1/2 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground",
          thick ? "h-8" : "h-5",
        )}
        style={{ left: position(currentMs) }}
      />
    </div>
  );
}
