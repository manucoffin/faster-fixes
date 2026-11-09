"use client";

import { Button } from "@workspace/ui/components/button";
import { PauseIcon, PlayIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { formatTimecode } from "../_helpers/format-timecode";
import { PlaybackRateMenu } from "./playback-rate-menu.client";
import type { useVideoPlayer } from "./use-video-player";

type VideoPlayerProps = {
  video: {
    width: number | null;
    height: number | null;
    posterUrl: string | null;
  };
  videoRef: RefObject<HTMLVideoElement | null>;
  player: ReturnType<typeof useVideoPlayer>;
  timeline: ReactNode;
  controls?: ReactNode;
  /** Drawn over the frame; it takes the clicks the video would. */
  overlay?: ReactNode;
  onPlaybackError: () => void;
};

export function VideoPlayer({
  video,
  videoRef,
  player,
  timeline,
  controls,
  overlay,
  onPlaybackError,
}: VideoPlayerProps) {
  const width = video.width ?? 16;
  const height = video.height ?? 9;

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-lg bg-black"
        style={{
          aspectRatio: `${width} / ${height}`,
          // Capping the width, not the height, keeps the box at the video's
          // ratio, so a portrait video stays within the viewport height and
          // the frame overlay still maps onto the picture.
          width: `min(100%, calc(70svh * ${width} / ${height}))`,
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
          aria-keyshortcuts="Space"
          title={player.paused ? "Play (Space)" : "Pause (Space)"}
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {controls}
          <PlaybackRateMenu
            playbackRate={player.playbackRate}
            onPlaybackRateChange={player.setPlaybackRate}
          />
        </div>
      </div>
    </div>
  );
}
