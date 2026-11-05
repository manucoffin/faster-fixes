"use client";

import { Button } from "@workspace/ui/components/button";
import { PauseIcon, PlayIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { formatTimecode } from "../../_helpers/format-timecode";
import type { ReviewVideo } from "../../_types/review-page-data";
import type { useVideoPlayer } from "./use-video-player";

type ReviewPlayerProps = {
  video: ReviewVideo;
  videoRef: RefObject<HTMLVideoElement | null>;
  player: ReturnType<typeof useVideoPlayer>;
  timeline: ReactNode;
  controls: ReactNode;
  /** Drawn over the frame; it takes the clicks the video would. */
  overlay: ReactNode;
  onPlaybackError: () => void;
};

export function ReviewPlayer({
  video,
  videoRef,
  player,
  timeline,
  controls,
  overlay,
  onPlaybackError,
}: ReviewPlayerProps) {
  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-lg bg-black"
        style={{
          aspectRatio: `${video.width ?? 16} / ${video.height ?? 9}`,
        }}
      >
        {/* The source is set by the player hook, so a refreshed URL resumes
            in place. */}
        <video
          ref={videoRef}
          poster={video.posterUrl ?? undefined}
          crossOrigin="anonymous"
          playsInline
          preload="metadata"
          onError={onPlaybackError}
          onClick={player.togglePlay}
          className="size-full"
        />
        {overlay}
      </div>

      {timeline}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={player.togglePlay}
          aria-label={player.paused ? "Play" : "Pause"}
        >
          {player.paused ? <PlayIcon /> : <PauseIcon />}
        </Button>
        <span className="font-mono text-sm tabular-nums">
          {formatTimecode(player.currentMs)}
          <span className="text-muted-foreground">
            {" "}
            / {formatTimecode(player.durationMs)}
          </span>
        </span>
        <div className="ml-auto">{controls}</div>
      </div>
    </div>
  );
}
