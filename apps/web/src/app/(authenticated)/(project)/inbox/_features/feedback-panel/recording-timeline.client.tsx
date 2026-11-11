"use client";

import { useTimelineScrub } from "@/app/_domains/video/video-player/use-timeline-scrub";
import { cn } from "@workspace/ui/lib/utils";

type RecordingTimelineProps = {
  time: number;
  duration: number;
  disabled: boolean;
  onSeek: (time: number) => void;
};

// The Recording along its duration. A press seeks, and dragging scrubs.
export function RecordingTimeline({
  time,
  duration,
  disabled,
  onSeek,
}: RecordingTimelineProps) {
  const { position, handlers } = useTimelineScrub(
    disabled ? 0 : duration,
    onSeek,
  );

  return (
    <div
      className={cn(
        "relative h-8 min-w-0 flex-1 touch-none select-none",
        disabled ? "opacity-50" : "cursor-pointer",
      )}
      {...handlers}
    >
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/30"
          style={{ width: position(time) }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground"
        style={{ left: position(time) }}
      />
    </div>
  );
}
