"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2];

type PlaybackRateMenuProps = {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
};

export function PlaybackRateMenu({
  playbackRate,
  onPlaybackRateChange,
}: PlaybackRateMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="font-mono tabular-nums"
          aria-label={`Playback speed, ${playbackRate}x`}
        >
          {playbackRate}x
        </Button>
      </DropdownMenuTrigger>
      {/* Focus would return to the trigger and keep its ring on screen. */}
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel>Speed</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(playbackRate)}
          onValueChange={(rate) => onPlaybackRateChange(Number(rate))}
        >
          {PLAYBACK_RATES.map((rate) => (
            <DropdownMenuRadioItem
              key={rate}
              value={String(rate)}
              className="font-mono tabular-nums"
            >
              {rate}x
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
