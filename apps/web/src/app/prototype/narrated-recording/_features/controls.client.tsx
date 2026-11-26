"use client";

// PROTOTYPE, throwaway. The few controls every variant shares.
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { Pause, Play } from "lucide-react";
import { DURATION_MS, timecode } from "./data";
import type { Playback } from "./use-fake-playback";

type PlayButtonProps = { playback: Playback };

export function PlayButton({ playback }: PlayButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={playback.isPlaying ? "Pause" : "Play"}
      title={playback.isPlaying ? "Pause (Space)" : "Play (Space)"}
      onClick={playback.toggle}
    >
      {playback.isPlaying ? <Pause /> : <Play />}
    </Button>
  );
}

type ClockProps = { time: number };

export function Clock({ time }: ClockProps) {
  return (
    <span className="shrink-0 font-mono text-sm tabular-nums">
      {timecode(time)}
      <span className="text-muted-foreground"> / {timecode(DURATION_MS)}</span>
    </span>
  );
}

type SpeedsProps = { playback: Playback };

export function Speeds({ playback }: SpeedsProps) {
  return (
    <div
      role="group"
      aria-label="Playback speed"
      className="flex shrink-0 items-center"
    >
      {playback.speeds.map((rate) => (
        <Button
          key={rate}
          variant="ghost"
          size="sm"
          aria-pressed={playback.speed === rate}
          className={cn(
            "font-mono tabular-nums",
            playback.speed !== rate && "text-muted-foreground",
          )}
          onClick={() => playback.setSpeed(rate)}
        >
          {rate}x
        </Button>
      ))}
    </div>
  );
}

type SkipSilenceProps = { playback: Playback };

export function SkipSilence({ playback }: SkipSilenceProps) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      <Switch
        checked={playback.isSkippingSilence}
        onCheckedChange={playback.setIsSkippingSilence}
      />
      Skip silence
    </label>
  );
}
