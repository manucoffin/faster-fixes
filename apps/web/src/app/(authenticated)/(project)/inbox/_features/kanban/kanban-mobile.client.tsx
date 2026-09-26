"use client";

import { DndContext } from "@dnd-kit/core";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import * as React from "react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { KanbanCard } from "./kanban-card.client";
import { getColumnSelectionState } from "./column-selection-state";

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

        return (
          <TabsContent
            key={col.id}
            value={col.id}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={getColumnSelectionState(itemIds, selectedIds)}
                onCheckedChange={() => onToggleSelectAll(col.id, itemIds)}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>

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
                      selectionMode={selectedIds.size > 0}
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
