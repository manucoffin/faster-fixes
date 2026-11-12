"use client";

import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";
import { useTimelineScrub } from "@/app/_domains/video/video-player/use-timeline-scrub";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import type {
  RecordingTimelineMark,
  RecordingTimelineMarkTone,
} from "../../_helpers/recording-log";

const MARK_CLASS: Record<RecordingTimelineMarkTone, string> = {
  step: "size-1.5 rounded-full bg-muted-foreground/60",
  warning: "h-3 w-1 rounded-sm bg-amber-500",
  error: "h-3 w-1 rounded-sm bg-destructive",
};

type RecordingTimelineProps = {
  time: number;
  duration: number;
  disabled: boolean;
  marks: RecordingTimelineMark[];
  onSeek: (time: number) => void;
};

// The Recording along its duration. A press seeks, and dragging scrubs. Marks
// read on hover and seek to their entry on click.
export function RecordingTimeline({
  time,
  duration,
  disabled,
  marks,
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
      {marks.map((mark, index) => (
        <Tooltip key={`${mark.time}-${index}`}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={mark.text}
              className={cn(
                "absolute top-1/2 flex h-5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center",
                // Errors and warnings over the steps they fall on.
                mark.tone !== "step" && "z-10",
              )}
              style={{ left: `${mark.position * 100}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onSeek(mark.time)}
            >
              <span className={MARK_CLASS[mark.tone]} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm break-words">
            <span className="font-mono tabular-nums opacity-70">
              {formatTimecode(mark.time)}
            </span>{" "}
            {mark.text}
          </TooltipContent>
        </Tooltip>
      ))}
      <div
        className="pointer-events-none absolute top-1/2 z-20 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground"
        style={{ left: position(time) }}
      />
    </div>
  );
}
