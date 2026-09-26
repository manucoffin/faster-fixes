"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/feedback-mutations/use-feedback-mutations";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import * as React from "react";
import { BulkActionToolbar } from "../actions-toolbar/bulk-action-toolbar.client";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { KanbanCardOverlay } from "./kanban-card.client";
import { KanbanColumnBody, KanbanColumnHeader } from "./kanban-column.client";
import { KanbanMobile } from "./kanban-mobile.client";

type FeedbackItem = ListFeedbackOutput[number];

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
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Slightly higher distance so a quick click never starts a drag.
      activationConstraint: { distance: 6 },
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
    for (const [key, items] of Object.entries(map)) {
      map[key] = sortFeedback(items, sort);
    }
    return map;
  }, [filtered, sort]);

  const totalCount = filtered.length;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const feedbackId = active.id as string;
    const newStatus = over.id as string;

    const item = feedback.find((f) => f.id === feedbackId);
    if (!item || item.status === newStatus) return;

    updateStatus(feedbackId, newStatus);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeFeedback = activeId
    ? (feedback.find((f) => f.id === activeId) ?? null)
    : null;

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

  const bulkToolbar = (
    <BulkActionToolbar
      selectedItems={feedback.filter((f) => selectedIds.has(f.id))}
      onMoveToStatus={(status) => handleBulkAction(status)}
      onArchive={() => handleBulkAction("closed")}
      onClearSelection={() => setSelectedIds(new Set())}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
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
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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
        {/* dropAnimation=null avoids the overlay sliding back to the source
            slot when the item has actually moved to another column. */}
        <DragOverlay dropAnimation={null}>
          {activeFeedback ? (
            <KanbanCardOverlay
              feedback={activeFeedback}
              isSelected={selectedIds.has(activeFeedback.id)}
              selectionMode={selectedIds.size > 0}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
