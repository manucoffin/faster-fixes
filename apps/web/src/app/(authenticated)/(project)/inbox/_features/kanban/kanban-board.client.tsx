"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import * as React from "react";
import { BulkActionToolbar } from "../bulk-action-toolbar.client";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { KanbanColumn } from "./kanban-column.client";

type FeedbackItem = GetFeedbackOutput[number];

type KanbanBoardProps = {
  feedback: FeedbackItem[];
  pageUrlFilter: string | null;
  sort: string;
  onStatusChange: (feedbackId: string, status: string) => void;
  onBulkStatusChange: (feedbackIds: string[], status: string) => void;
  onSelectFeedback: (id: string) => void;
};

const COLUMNS = [
  { id: "new", title: "New" },
  { id: "in_progress", title: "In Progress" },
  { id: "resolved", title: "Resolved" },
] as const;

function sortFeedback(items: FeedbackItem[], sort: string): FeedbackItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      default: // newest
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });
}

export function KanbanBoard({
  feedback,
  pageUrlFilter,
  sort,
  onStatusChange,
  onBulkStatusChange,
  onSelectFeedback,
}: KanbanBoardProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  // Filter out closed items and apply page URL filter
  const filtered = React.useMemo(() => {
    let items = feedback.filter((f) => f.status !== "closed");
    if (pageUrlFilter) {
      items = items.filter((f) => f.pageUrl === pageUrlFilter);
    }
    return items;
  }, [feedback, pageUrlFilter]);

  const grouped = React.useMemo(() => {
    const map: Record<string, FeedbackItem[]> = {
      new: [],
      in_progress: [],
      resolved: [],
    };
    for (const item of filtered) {
      map[item.status]?.push(item);
    }
    // Sort each column
    for (const key of Object.keys(map)) {
      map[key] = sortFeedback(map[key]!, sort);
    }
    return map;
  }, [filtered, sort]);

  const totalCount = filtered.length;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const feedbackId = active.id as string;
    const newStatus = over.id as string;

    // Find the current status of the dragged item
    const item = feedback.find((f) => f.id === feedbackId);
    if (!item || item.status === newStatus) return;

    onStatusChange(feedbackId, newStatus);
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSelectAll(_columnId: string, itemIds: string[]) {
    setSelectedIds((prev) => {
      const allSelected = itemIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        for (const id of itemIds) next.delete(id);
      } else {
        for (const id of itemIds) next.add(id);
      }
      return next;
    });
  }

  function handleBulkAction(status: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    onBulkStatusChange(ids, status);
    setSelectedIds(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </p>
      </div>

      <BulkActionToolbar
        selectedCount={selectedIds.size}
        onMoveToStatus={(status) => handleBulkAction(status)}
        onArchive={() => handleBulkAction("closed")}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              items={grouped[col.id] ?? []}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectFeedback={onSelectFeedback}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
