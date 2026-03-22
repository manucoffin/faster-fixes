"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/use-feedback-mutations";
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
import { BulkActionToolbar } from "../actions-toolbar/bulk-action-toolbar.client";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";
import { KanbanColumnBody, KanbanColumnHeader } from "./kanban-column.client";
import { KanbanMobile } from "./kanban-mobile.client";

type FeedbackItem = GetFeedbackOutput[number];

type KanbanBoardProps = {
  feedback: FeedbackItem[];
  pageUrlFilter: string | null;
  sort: string;
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
  onSelectFeedback,
}: KanbanBoardProps) {
  const { updateStatus, bulkUpdateStatus } = useFeedbackMutations();
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

  const bulkToolbar = (
    <BulkActionToolbar
      selectedItems={feedback.filter((f) => selectedIds.has(f.id))}
      onMoveToStatus={(status) => handleBulkAction(status)}
      onArchive={() => handleBulkAction("closed")}
      onClearSelection={() => setSelectedIds(new Set())}
    />
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const feedbackId = active.id as string;
    const newStatus = over.id as string;

    // Find the current status of the dragged item
    const item = feedback.find((f) => f.id === feedbackId);
    if (!item || item.status === newStatus) return;

    updateStatus(feedbackId, newStatus);
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
    bulkUpdateStatus(ids, status);
    setSelectedIds(new Set());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </p>
      </div>

      <KanbanMobile
        columns={COLUMNS}
        grouped={grouped}
        selectedIds={selectedIds}
        toolbar={bulkToolbar}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onSelectFeedback={onSelectFeedback}
      />

      {/* Desktop: column headers */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <KanbanColumnHeader
            key={col.id}
            id={col.id}
            title={col.title}
            count={(grouped[col.id] ?? []).length}
            selectedIds={selectedIds}
            itemIds={(grouped[col.id] ?? []).map((i) => i.id)}
            onToggleSelectAll={handleToggleSelectAll}
          />
        ))}
      </div>

      <div className="hidden lg:block">{bulkToolbar}</div>

      {/* Desktop: columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="hidden gap-4 lg:grid lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <KanbanColumnBody
              key={col.id}
              id={col.id}
              items={grouped[col.id] ?? []}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectFeedback={onSelectFeedback}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
