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

type ReplaceVideoLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReplacing: boolean;
  onReplaceLink: () => Promise<unknown>;
};

export function ReplaceVideoLinkDialog({
  open,
  onOpenChange,
  isReplacing,
  onReplaceLink,
}: ReplaceVideoLinkDialogProps) {
  const handleReplace = async () => {
    try {
      await onReplaceLink();
      onOpenChange(false);
    } catch {
      // The toast already reports it; the dialog stays for a retry.
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rotate link?</AlertDialogTitle>
          <AlertDialogDescription>
            Everyone holding the current link loses access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReplacing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isReplacing}
            onClick={(event) => {
              event.preventDefault();
              void handleReplace();
            }}
          >
            {isReplacing ? "Rotating..." : "Rotate link"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
