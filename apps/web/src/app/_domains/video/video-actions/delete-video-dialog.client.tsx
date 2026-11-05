"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

import { describeVideoDeletion } from "../_helpers/describe-video-deletion";

type DeleteVideoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackCount: number;
  isDeleting: boolean;
  onDelete: () => Promise<unknown>;
};

export function DeleteVideoDialog({
  open,
  onOpenChange,
  feedbackCount,
  isDeleting,
  onDelete,
}: DeleteVideoDialogProps) {
  const handleDelete = async () => {
    try {
      await onDelete();
      onOpenChange(false);
    } catch {
      // The toast already reports it; the dialog stays for a retry.
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete video?</AlertDialogTitle>
          <AlertDialogDescription>
            {describeVideoDeletion(feedbackCount)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(event) => {
              // Closes on success only, once the Video is gone.
              event.preventDefault();
              void handleDelete();
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
