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
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Trash2 } from "lucide-react";

type RemoveRecordingDialogProps = {
  onConfirm: () => void;
  disabled?: boolean;
};

export function RemoveRecordingDialog({
  onConfirm,
  disabled,
}: RemoveRecordingDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={disabled}>
          <Trash2 className="mr-1 size-3" />
          Remove recording
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this recording?</AlertDialogTitle>
          <AlertDialogDescription>
            The recording is deleted permanently. The feedback and its
            screenshot are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Remove recording
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
