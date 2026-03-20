"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Archive, ArrowRight, X } from "lucide-react";

type BulkActionToolbarProps = {
  selectedCount: number;
  onMoveToStatus: (status: string) => void;
  onArchive: () => void;
  onClearSelection: () => void;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
] as const;

export function BulkActionToolbar({
  selectedCount,
  onMoveToStatus,
  onArchive,
  onClearSelection,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-muted/50 flex items-center gap-2 rounded-lg border p-2">
      <Badge variant="secondary">{selectedCount} selected</Badge>

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground ml-2 text-xs">Move to:</span>
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            onClick={() => onMoveToStatus(option.value)}
            className="h-7 text-xs"
          >
            <ArrowRight className="mr-1 size-3" />
            {option.label}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onArchive}
        className="h-7 text-xs"
      >
        <Archive className="mr-1 size-3" />
        Archive
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="ml-auto h-7 text-xs"
      >
        <X className="mr-1 size-3" />
        Clear
      </Button>
    </div>
  );
}
