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

type DeleteFeedbackDialogProps = {
  count: number;
  onConfirm: () => void;
  disabled?: boolean;
  // Controlled when opened from a menu item, which unmounts with its menu and
  // so cannot host the trigger itself.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeleteFeedbackDialog({
  count,
  onConfirm,
  disabled,
  open,
  onOpenChange,
}: DeleteFeedbackDialogProps) {
  const isControlled = open !== undefined;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={disabled}>
            <Trash2 className="mr-1 size-3" />
            Delete {count > 1 ? `(${count})` : ""}
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently delete feedback</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {count}{" "}
            {count === 1 ? "feedback item" : "feedback items"} and{" "}
            {count === 1 ? "its" : "their"} associated screenshots. Linked
            tracker issues are not affected. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
