"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog";

type RecordingPlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Full-window surface over the inbox, above the detail panel.
export function RecordingPlayer({ open, onOpenChange }: RecordingPlayerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none border-none p-0 sm:max-w-none">
        <div className="shrink-0 border-b px-4 py-3 pr-12">
          <DialogTitle className="text-sm">Recording</DialogTitle>
          <DialogDescription className="sr-only">
            Recording of the page before this feedback was submitted
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 bg-muted/30" />
      </DialogContent>
    </Dialog>
  );
}
