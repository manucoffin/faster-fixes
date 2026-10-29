"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { useId, useState } from "react";
import type { SelectionFrame } from "../../_helpers/selection-frame";
import { SelectionFrameOverlay } from "./selection-frame-overlay";

type ScreenshotDialogProps = {
  src: string;
  frame: SelectionFrame | null;
};

export function ScreenshotDialog({ src, frame }: ScreenshotDialogProps) {
  const [isFrameShown, setIsFrameShown] = useState(true);
  const visibleFrame = isFrameShown ? frame : null;

  return (
    <div className="flex flex-col gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <button type="button" className="relative cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- screenshots come from the deployment's own storage host, which is not in the static remotePatterns allowlist */}
            <img
              src={src}
              alt="Feedback screenshot"
              className="w-full rounded-md border"
            />
            {visibleFrame && <SelectionFrameOverlay frame={visibleFrame} />}
          </button>
        </DialogTrigger>
        <DialogContent className="flex h-[calc(100vh-2rem)] flex-col gap-0 overflow-auto rounded-none border-none p-0 sm:max-w-[calc(100%-2rem)]">
          <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
          <DialogDescription className="sr-only">
            Full-size feedback screenshot
          </DialogDescription>
          {frame && (
            <SelectionFrameSwitch
              checked={isFrameShown}
              onCheckedChange={setIsFrameShown}
              className="shrink-0 px-4 py-3 pr-12"
            />
          )}
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {/* The wrapper shrinks to the image, so the frame's percentages map onto its pixels. */}
            <div className="relative max-h-full max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- screenshots come from the deployment's own storage host, which is not in the static remotePatterns allowlist */}
              <img
                src={src}
                alt="Feedback screenshot"
                className="block max-h-[calc(100vh-2rem-3rem)] max-w-full object-contain"
              />
              {visibleFrame && <SelectionFrameOverlay frame={visibleFrame} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {frame && (
        <SelectionFrameSwitch
          checked={isFrameShown}
          onCheckedChange={setIsFrameShown}
        />
      )}
    </div>
  );
}

type SelectionFrameSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

function SelectionFrameSwitch({
  checked,
  onCheckedChange,
  className,
}: SelectionFrameSwitchProps) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        Show selection frame
      </Label>
    </div>
  );
}
