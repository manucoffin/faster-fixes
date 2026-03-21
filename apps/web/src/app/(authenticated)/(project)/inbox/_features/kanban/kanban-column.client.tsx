"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { KanbanCard } from "./kanban-card.client";

type FeedbackItem = GetFeedbackOutput[number];

type KanbanColumnProps = {
  id: string;
  title: string;
  items: FeedbackItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (columnId: string, itemIds: string[]) => void;
  onSelectFeedback: (id: string) => void;
};

export function KanbanColumn({
  id,
  title,
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelectFeedback,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const columnItemIds = items.map((i) => i.id);
  const allSelected =
    columnItemIds.length > 0 &&
    columnItemIds.every((id) => selectedIds.has(id));
  const someSelected = columnItemIds.some((id) => selectedIds.has(id));

  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={() => onToggleSelectAll(id, columnItemIds)}
        />
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {items.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors",
          isOver ? "border-primary/50 bg-primary/5" : "border-transparent",
        )}
      >
        {items.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center py-8 text-center text-sm">
            No items
          </div>
        ) : (
          items.map((feedback) => (
            <KanbanCard
              key={feedback.id}
              feedback={feedback}
              isSelected={selectedIds.has(feedback.id)}
              selectionMode={selectedIds.size > 0}
              onToggleSelect={onToggleSelect}
              onSelect={onSelectFeedback}
            />
          ))
        )}
      </div>
    </div>
  );
}
