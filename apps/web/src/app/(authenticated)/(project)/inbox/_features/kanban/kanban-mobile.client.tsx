"use client";

import { DndContext } from "@dnd-kit/core";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import * as React from "react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { KanbanCard } from "./kanban-card.client";
import { getBoardStatusAppearance } from "./board-status-appearance";
import { ColumnSelectCheckbox } from "./column-select-checkbox.client";

type FeedbackItem = ListFeedbackOutput[number];

type KanbanColumn = { id: string; title: string };

type KanbanMobileProps = {
  columns: readonly [KanbanColumn, ...KanbanColumn[]];
  grouped: Record<string, FeedbackItem[]>;
  selectedIds: Set<string>;
  toolbar: React.ReactNode;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (columnId: string, itemIds: string[]) => void;
  onSelectFeedback: (id: string) => void;
};

export function KanbanMobile({
  columns,
  grouped,
  selectedIds,
  toolbar,
  onToggleSelect,
  onToggleSelectAll,
  onSelectFeedback,
}: KanbanMobileProps) {
  const [activeColumn, setActiveColumn] = React.useState<string>(columns[0].id);

  return (
    <Tabs
      value={activeColumn}
      onValueChange={setActiveColumn}
      className="lg:hidden"
    >
      <TabsList className="w-full">
        {columns.map((col) => (
          <TabsTrigger key={col.id} value={col.id}>
            <span
              className={cn(
                "mr-1.5 size-2 rounded-full",
                getBoardStatusAppearance(col.id).swatchClassName,
              )}
            />
            {col.title}
            <span className="ml-1.5 tabular-nums">
              ({(grouped[col.id] ?? []).length})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {columns.map((col) => {
        const items = grouped[col.id] ?? [];
        const itemIds = items.map((i) => i.id);
        const selectedCount = itemIds.filter((id) =>
          selectedIds.has(id),
        ).length;

        return (
          <TabsContent
            key={col.id}
            value={col.id}
            className="flex flex-col gap-4"
          >
            {items.length > 0 && (
              // pl-3 lines this checkbox up with the ones inside the cards.
              <label className="flex h-7 items-center gap-2 pl-3 text-xs text-muted-foreground">
                <ColumnSelectCheckbox
                  columnTitle={col.title}
                  itemIds={itemIds}
                  selectedIds={selectedIds}
                  onToggle={() => onToggleSelectAll(col.id, itemIds)}
                />
                <span className="tabular-nums">
                  {selectedCount === 0
                    ? `Select all ${items.length}`
                    : `${selectedCount} of ${items.length} selected`}
                </span>
              </label>
            )}

            {toolbar}

            <DndContext>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No items
                  </div>
                ) : (
                  items.map((item) => (
                    <KanbanCard
                      key={item.id}
                      feedback={item}
                      isSelected={selectedIds.has(item.id)}
                      // No drop target on mobile: status changes go through the panel or the bulk toolbar.
                      isDraggable={false}
                      isSortable={false}
                      onToggleSelect={onToggleSelect}
                      onSelect={onSelectFeedback}
                    />
                  ))
                )}
              </div>
            </DndContext>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
