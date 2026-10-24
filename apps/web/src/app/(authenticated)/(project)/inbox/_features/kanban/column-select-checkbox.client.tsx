"use client";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import { getColumnSelectionState } from "./column-selection-state";

type ColumnSelectCheckboxProps = {
  columnTitle: string;
  itemIds: string[];
  selectedIds: Set<string>;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
};

export function ColumnSelectCheckbox({
  columnTitle,
  itemIds,
  selectedIds,
  onToggle,
  disabled = false,
  className,
}: ColumnSelectCheckboxProps) {
  return (
    <Checkbox
      // Tints the partial state so it does not read as an empty box.
      className={cn(
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary/20",
        className,
      )}
      checked={getColumnSelectionState(itemIds, selectedIds)}
      disabled={disabled || itemIds.length === 0}
      onCheckedChange={onToggle}
      aria-label={`Select all ${columnTitle}`}
    />
  );
}
