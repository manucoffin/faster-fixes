"use client";

import { Button } from "@workspace/ui/components/button";
import { Slider } from "@workspace/ui/components/slider";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useRef } from "react";
import { formatTimecode } from "../../_helpers/format-timecode";
import type { ReviewVideo } from "../../_types/review-page-data";
import { useVideoPlayer } from "./use-video-player";

type ReviewPlayerProps = {
  video: ReviewVideo;
  onPlaybackError: () => void;
};

export function ReviewPlayer({ video, onPlaybackError }: ReviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(videoRef, video.playbackUrl, video.durationMs);

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-lg bg-black"
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
      </div>

      <Slider
        value={[player.currentMs]}
        max={Math.max(player.durationMs, 1)}
        step={1}
        disabled={player.durationMs === 0}
        onValueChange={([ms]) => {
          if (ms !== undefined) player.seek(ms);
        }}
        aria-label="Seek"
      />

      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
