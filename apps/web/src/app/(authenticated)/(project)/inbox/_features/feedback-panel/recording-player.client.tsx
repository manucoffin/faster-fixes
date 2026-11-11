"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { RecordingStage } from "./recording-stage.client";
import { RemoveRecordingDialog } from "./remove-recording-dialog.client";
import { useDeleteFeedbackRecording } from "./use-delete-feedback-recording";

type RecordingPlayerProps = {
  feedbackId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Full-window surface over the inbox, above the detail panel.
export function RecordingPlayer({
  feedbackId,
  projectId,
  open,
  onOpenChange,
}: RecordingPlayerProps) {
  const deleteRecording = useDeleteFeedbackRecording({
    projectId,
    onDeleted: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none border-none p-0 sm:max-w-none">
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3 pr-12">
          <DialogTitle className="text-sm">Recording</DialogTitle>
          <DialogDescription className="sr-only">
            Recording of the page before this feedback was submitted
          </DialogDescription>
          <div className="ml-auto">
            <RemoveRecordingDialog
              onConfirm={() => deleteRecording.mutate({ feedbackId })}
              disabled={deleteRecording.isPending}
            />
          </div>
        </div>
        <RecordingStage feedbackId={feedbackId} />
      </DialogContent>
    </Dialog>
  );
}
