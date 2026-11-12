"use client";

import { cn } from "@workspace/ui/lib/utils";
import { formatFeedbackTime } from "../_helpers/format-timecode";
import { useTimelineScrub } from "./use-timeline-scrub";

/** One Feedback on the timeline, coloured by the caller. */
export type VideoTimelineMarker = {
  id: string;
  startMs: number;
  endMs: number | null;
  colorClassName: string;
  /** Drawn above the other markers. */
  raised?: boolean;
};

/** The section being marked: an open out point follows the playhead. */
export type VideoTimelineDraftRange = {
  startMs: number;
  endMs: number | null;
};

type VideoTimelineProps = {
  durationMs: number;
  currentMs: number;
  markers: VideoTimelineMarker[];
  activeMarkerId: string | null;
  draftRange?: VideoTimelineDraftRange | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (markerId: string) => void;
};

// Every marker as a dot (instant) or a bar (range) along the Video. A press on
// the bar seeks, and dragging scrubs.
export function VideoTimeline({
  durationMs,
  currentMs,
  markers,
  activeMarkerId,
  draftRange = null,
  onSeek,
  onMarkerClick,
}: VideoTimelineProps) {
  const { position, handlers } = useTimelineScrub(durationMs, onSeek);

  return (
    <div
      className="relative h-8 w-full cursor-pointer touch-none select-none"
      {...handlers}
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

      {draftRange ? (
        <DraftRange
          startMs={draftRange.startMs}
          endMs={draftRange.endMs}
          currentMs={currentMs}
          position={position}
        />
      ) : null}

      <div
        className="pointer-events-none absolute top-1/2 z-20 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground"
        style={{ left: position(currentMs) }}
      />
    </div>
  );
}

type DraftRangeProps = VideoTimelineDraftRange & {
  currentMs: number;
  position: (ms: number) => string;
};

// Until the out point is set, the bar previews the section Mark out would
// close at the playhead, so the Reviewer sees where it runs.
function DraftRange({ startMs, endMs, currentMs, position }: DraftRangeProps) {
  const previewEndMs = endMs ?? (currentMs > startMs ? currentMs : null);

  return (
    <>
      {previewEndMs !== null ? (
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 z-10 h-2 -translate-y-1/2",
            endMs === null ? "bg-primary/40" : "bg-primary",
          )}
          style={{
            left: position(startMs),
            width: `calc(${position(previewEndMs)} - ${position(startMs)})`,
          }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute top-1/2 z-10 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: position(startMs) }}
      />
      {endMs !== null ? (
        <div
          className="pointer-events-none absolute top-1/2 z-10 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: position(endMs) }}
        />
      ) : null}
    </>
  );
}
