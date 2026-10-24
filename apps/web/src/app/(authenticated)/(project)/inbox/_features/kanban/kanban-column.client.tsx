"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@workspace/ui/lib/utils";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { readDropStatus } from "../../_helpers/board-drop-target";
import { KanbanCard } from "./kanban-card.client";

type FeedbackItem = ListFeedbackOutput[number];

type KanbanColumnBodyProps = {
  id: string;
  items: FeedbackItem[];
  selectedIds: Set<string>;
  isSortable: boolean;
  onToggleSelect: (id: string) => void;
  onSelectFeedback: (id: string) => void;
};

export function KanbanColumnBody({
  id,
  items,
  selectedIds,
  isSortable,
  onToggleSelect,
  onSelectFeedback,
}: KanbanColumnBodyProps) {
  const { setNodeRef, over } = useDroppable({ id, data: { status: id } });
  // Hovering one of the column's cards still targets the column.
  const isOver = readDropStatus(over) === id;
  const itemIds = items.map((feedback) => feedback.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors",
        isOver
          ? "border-primary/50 bg-primary/5"
          : "border-transparent bg-muted/50",
      )}
    >
      <SortableContext
        id={id}
        items={itemIds}
        strategy={verticalListSortingStrategy}
      >
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No items
          </div>
        ) : (
          items.map((feedback) => (
            <KanbanCard
              key={feedback.id}
              feedback={feedback}
              isSelected={selectedIds.has(feedback.id)}
              isDraggable
              isSortable={isSortable}
              onToggleSelect={onToggleSelect}
              onSelect={onSelectFeedback}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}
