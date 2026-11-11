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
import { FileWarning, Pause, Play } from "lucide-react";
import { useRecordingStage } from "./use-recording-stage";

type RecordingStageProps = {
  feedbackId: string;
};

export function RecordingStage({ feedbackId }: RecordingStageProps) {
  const { frameRef, events, status, state, togglePlayback } =
    useRecordingStage(feedbackId);
  const isPlaying = state === "playing";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={status !== "loaded"}
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
      </div>
    </div>
  );
}
