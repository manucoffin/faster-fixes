"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Archive, ArrowRight, X } from "lucide-react";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { CopySelectedMarkdown } from "./copy-selected-markdown.client";

type BulkActionToolbarProps = {
  selectedItems: GetFeedbackOutput[number][];
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
  selectedItems,
  onMoveToStatus,
  onArchive,
  onClearSelection,
}: BulkActionToolbarProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="bg-muted/50 animate-in fade-in flex items-center gap-2 rounded-lg border p-2 duration-200">
      <Badge variant="secondary">
        <span className="tabular-nums">{selectedItems.length}</span> selected
      </Badge>

      <CopySelectedMarkdown items={selectedItems} />

      <Separator
        orientation="vertical"
        className="ml-2 data-[orientation=vertical]:h-5"
      />

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
