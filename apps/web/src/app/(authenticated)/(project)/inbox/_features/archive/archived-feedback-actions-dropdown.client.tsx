"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ArchiveRestore, MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";
import { DeleteFeedbackDialog } from "./delete-feedback-dialog.client";

type ArchivedFeedbackActionsDropdownProps = {
  onRestore: () => void;
  onDelete: () => void;
  disabled: boolean;
};

export function ArchivedFeedbackActionsDropdown({
  onRestore,
  onDelete,
  disabled,
}: ArchivedFeedbackActionsDropdownProps) {
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Feedback actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onRestore}>
            <ArchiveRestore className="size-4" />
            Restore
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteFeedbackDialog
        count={1}
        onConfirm={onDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
