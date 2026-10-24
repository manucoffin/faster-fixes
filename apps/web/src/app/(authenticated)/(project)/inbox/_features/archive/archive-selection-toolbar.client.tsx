"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { DeleteFeedbackDialog } from "./delete-feedback-dialog.client";

type ArchiveSelectionToolbarProps = {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  disabled: boolean;
};

export function ArchiveSelectionToolbar({
  selectedCount,
  onDelete,
  onClearSelection,
  disabled,
}: ArchiveSelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex animate-in flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2 duration-200 fade-in">
      <Badge variant="secondary">
        <span className="tabular-nums">{selectedCount}</span> selected
      </Badge>

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
