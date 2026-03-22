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
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { KanbanCard } from "./kanban-card.client";

type FeedbackItem = GetFeedbackOutput[number];

type KanbanMobileProps = {
  columns: readonly { id: string; title: string }[];
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
  const [activeColumn, setActiveColumn] = React.useState<string>(
    columns[0]!.id,
  );

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
        const allSelected =
          itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
        const someSelected = itemIds.some((id) => selectedIds.has(id));

        return (
          <TabsContent
            key={col.id}
            value={col.id}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onCheckedChange={() => onToggleSelectAll(col.id, itemIds)}
              />
              <span className="text-muted-foreground text-xs">Select all</span>
            </div>

            {toolbar}

            <DndContext>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center text-sm">
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
