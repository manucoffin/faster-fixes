"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { FileWarning, Pause, Play } from "lucide-react";
import { useState } from "react";
import { recordingTimelineMarks } from "../../_helpers/recording-log";
import { RECORDING_SPEEDS } from "../../_helpers/recording-stage";
import type { SelectionFrame } from "../../_helpers/selection-frame";
import { RecordingLog } from "./recording-log.client";
import { RecordingTimeline } from "./recording-timeline.client";
import { SelectionFrameOverlay } from "./selection-frame-overlay";
import { SelectionFrameSwitch } from "./selection-frame-switch.client";
import { useRecordingStage } from "./use-recording-stage";

type RecordingStageProps = {
  feedbackId: string;
  /** Null when the Feedback has no Selection geometry: no frame, no switch. */
  selectionFrame: SelectionFrame | null;
};

export function RecordingStage({
  feedbackId,
  selectionFrame,
}: RecordingStageProps) {
  const {
    frameRef,
    events,
    status,
    state,
    time,
    duration,
    isOnSelectionInstant,
    speed,
    togglePlayback,
    seek,
    setSpeed,
  } = useRecordingStage(feedbackId);
  const isPlaying = state === "playing";
  const isLoaded = status === "loaded";
  const [isFrameShown, setIsFrameShown] = useState(true);
  const trpc = useTRPC();
  // Shared with the stage hook and the log, so no second request.
  const { data: playback } = useQuery(
    trpc.authenticated.projects.feedback.getRecordingPlayback.queryOptions({
      feedbackId,
    }),
  );
  const marks =
    isLoaded && playback && playback.startedAt !== null
      ? recordingTimelineMarks(playback.entries, {
          startedAt: playback.startedAt,
          durationMs: playback.durationMs,
        })
      : [];

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 bg-muted/30">
          {status === "unplayable" ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileWarning />
                </EmptyMedia>
                <EmptyDescription>
                  This recording cannot be played. See the screenshot for the
                  reported state.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {events && (
                <iframe
                  ref={frameRef}
                  src="/recording-player"
                  title="Recording"
                  // The minimum the replayer needs; it sandboxes the rebuilt page itself.
                  sandbox="allow-scripts allow-same-origin"
                  referrerPolicy="no-referrer"
                  className={cn(
                    "absolute inset-0 size-full border-0",
                    status === "loading" && "invisible",
                  )}
                />
              )}
              {status === "loading" && (
                <Skeleton className="absolute inset-6 rounded-md" />
              )}
              {/* Over the frame, so a click on the page plays and pauses and
                keeps focus, and so Space, in the dashboard. */}
              {isLoaded && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="absolute inset-0 cursor-default"
                  onClick={togglePlayback}
                />
              )}
              {selectionFrame && isFrameShown && isOnSelectionInstant && (
                <SelectionFrameBox frame={selectionFrame} />
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-keyshortcuts="Space"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            disabled={!isLoaded}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <span className="shrink-0 font-mono text-sm tabular-nums">
            {formatTimecode(time)}
            <span className="text-muted-foreground">
              {" "}
              / {formatTimecode(duration)}
            </span>
          </span>
          <RecordingTimeline
            time={time}
            duration={duration}
            disabled={!isLoaded}
            marks={marks}
            onSeek={seek}
          />
          <div
            role="group"
            aria-label="Playback speed"
            className="flex shrink-0 items-center"
          >
            {RECORDING_SPEEDS.map((rate) => (
              <Button
                key={rate}
                variant="ghost"
                size="sm"
                aria-pressed={speed === rate}
                disabled={!isLoaded}
                className={cn(
                  "font-mono tabular-nums",
                  speed !== rate && "text-muted-foreground",
                )}
                onClick={() => setSpeed(rate)}
              >
                {rate}x
              </Button>
            ))}
          </div>
          {selectionFrame && (
            <SelectionFrameSwitch
              checked={isFrameShown}
              onCheckedChange={setIsFrameShown}
              className="shrink-0"
            />
          )}
        </div>
      </div>
      <RecordingLog
        feedbackId={feedbackId}
        time={time}
        isLoaded={isLoaded}
        onSeek={seek}
      />
    </div>
  );
}

type SelectionFrameBoxProps = {
  frame: SelectionFrame;
};

// Fits the Selection's viewport to the stage as the player document fits the
// recorded one, so the frame's percentages land on the replayed page.
function SelectionFrameBox({ frame }: SelectionFrameBoxProps) {
  const ratio = frame.aspectRatio;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ containerType: "size" }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: `min(100cqw, ${String(ratio * 100)}cqh)`,
          height: `min(100cqh, ${String(100 / ratio)}cqw)`,
        }}
      >
        <SelectionFrameOverlay frame={frame} />
      </div>
    </div>
  );
}
