"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";

type ScreenshotDialogProps = {
  src: string;
};

export function ScreenshotDialog({ src }: ScreenshotDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element -- screenshots come from the deployment's own storage host, which is not in the static remotePatterns allowlist */}
          <img
            src={src}
            alt="Feedback screenshot"
            className="w-full rounded-md border"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="h-[calc(100vh-2rem)] overflow-auto rounded-none border-none p-0 sm:max-w-[calc(100%-2rem)]">
        <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size feedback screenshot
        </DialogDescription>
        {/* eslint-disable-next-line @next/next/no-img-element -- screenshots come from the deployment's own storage host, which is not in the static remotePatterns allowlist */}
        <img
          src={src}
          alt="Feedback screenshot"
          className="h-full w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
