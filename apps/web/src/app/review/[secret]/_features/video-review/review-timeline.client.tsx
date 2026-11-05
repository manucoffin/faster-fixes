"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useState, type PointerEvent } from "react";
import { formatFeedbackTime } from "../../_helpers/format-timecode";
import { isHiddenByDefault } from "../../_helpers/list-visible-feedback";
import type { ReviewFeedbackItem } from "../../_types/review-page-data";

type ReviewTimelineProps = {
  durationMs: number;
  currentMs: number;
  feedback: ReviewFeedbackItem[];
  ownReviewerId: string | null;
  activeFeedbackId: string | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (feedbackId: string) => void;
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function markerColor(
  feedback: ReviewFeedbackItem,
  isOwn: boolean,
  isActive: boolean,
) {
  if (isActive) return "bg-primary";
  if (isHiddenByDefault(feedback.status)) return "bg-success";
  return isOwn ? "bg-foreground" : "bg-foreground/50";
}

// Every visible Feedback as a dot (instant) or a bar (range) along the Video.
// A press on the bar seeks, and dragging scrubs.
export function ReviewTimeline({
  durationMs,
  currentMs,
  feedback,
  ownReviewerId,
  activeFeedbackId,
  onSeek,
  onMarkerClick,
}: ReviewTimelineProps) {
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

      {feedback.map((item) => {
        const isOwn = item.reviewer.id === ownReviewerId;
        const isActive = item.id === activeFeedbackId;
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
              isOwn || isActive ? "z-10" : null,
              markerColor(item, isOwn, isActive),
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
