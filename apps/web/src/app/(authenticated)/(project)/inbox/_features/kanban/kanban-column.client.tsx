"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { KanbanCard } from "./kanban-card.client";

type FeedbackItem = GetFeedbackOutput[number];

type KanbanColumnHeaderProps = {
  id: string;
  title: string;
  count: number;
  selectedIds: Set<string>;
  itemIds: string[];
  onToggleSelectAll: (columnId: string, itemIds: string[]) => void;
};

export function KanbanColumnHeader({
  id,
  title,
  count,
  selectedIds,
  itemIds,
  onToggleSelectAll,
}: KanbanColumnHeaderProps) {
  const allSelected =
    itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
  const someSelected = itemIds.some((id) => selectedIds.has(id));

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={() => onToggleSelectAll(id, itemIds)}
      />
      <h3 className="text-sm font-medium">{title}</h3>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}

type KanbanColumnBodyProps = {
  id: string;
  items: FeedbackItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectFeedback: (id: string) => void;
};

export function KanbanColumnBody({
  id,
  items,
  selectedIds,
  onToggleSelect,
  onSelectFeedback,
}: KanbanColumnBodyProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
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
  );
}
