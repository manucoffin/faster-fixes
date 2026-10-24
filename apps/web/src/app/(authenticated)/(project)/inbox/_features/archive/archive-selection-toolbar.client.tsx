"use client";

import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { DeleteFeedbackDialog } from "./delete-feedback-dialog.client";

type ArchiveSelectionToolbarProps = {
  selectedCount: number;
  pageItemCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  disabled: boolean;
};

export function ArchiveSelectionToolbar({
  selectedCount,
  pageItemCount,
  onDelete,
  onClearSelection,
  disabled,
}: ArchiveSelectionToolbarProps) {
  return (
    <div role="toolbar" className="flex flex-1 items-center gap-3">
      <span className="text-sm font-medium tabular-nums">
        {selectedCount} of {pageItemCount} selected
      </span>

      <DeleteFeedbackDialog
        count={selectedCount}
        onConfirm={onDelete}
        disabled={disabled}
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        disabled={disabled}
        className="ml-auto h-7 text-xs"
      >
        <X className="mr-1 size-3" />
        Clear
      </Button>
    </div>
  );
}
