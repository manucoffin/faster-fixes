"use client";

import { useFeedbackMutations } from "@/app/(authenticated)/(project)/inbox/_features/feedback-mutations/use-feedback-mutations";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import * as React from "react";
import {
  type BoardSort,
  resolveDropNeighbours,
  sortColumnFeedback,
} from "../../_helpers/board-column-order";
import { BulkActionToolbar } from "../actions-toolbar/bulk-action-toolbar.client";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { readDropStatus } from "../../_helpers/board-drop-target";
import { BoardSummaryStrip } from "./board-summary-strip";
import { KanbanCardOverlay } from "./kanban-card.client";
import { KanbanColumnBody } from "./kanban-column.client";
import { KanbanMobile } from "./kanban-mobile.client";

type FeedbackItem = ListFeedbackOutput[number];

type KanbanBoardProps = {
  feedback: FeedbackItem[];
  pageUrlFilter: string | null;
  sort: BoardSort;
  onSelectFeedback: (id: string) => void;
};

const COLUMNS = [
  { id: "new", title: "New" },
  { id: "in_progress", title: "In Progress" },
  { id: "resolved", title: "Resolved" },
] as const;

export function KanbanBoard({
  feedback,
  pageUrlFilter,
  sort,
  onSelectFeedback,
}: KanbanBoardProps) {
  const { updateStatus, bulkUpdateStatus, moveFeedback } =
    useFeedbackMutations();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    // The whole card is the drag source, so a click must still open it: the
    // mouse drags only after moving, touch only after a long press (so the
    // board still scrolls).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    for (const [key, items] of Object.entries(map)) {
      map[key] = sortColumnFeedback(items, sort);
    }
    return map;
  }, [filtered, sort]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    const feedbackId = active.id as string;
    const newStatus = readDropStatus(over);

    const item = feedback.find((f) => f.id === feedbackId);
    if (!item || !over || !newStatus) return;

    if (item.status !== newStatus) {
      updateStatus(feedbackId, newStatus);
      return;
    }

    // A date sort would put the card straight back, so only Manual reorders.
    if (sort !== "manual" || over.id === feedbackId) return;

    // Under the page filter these are the visible cards, so the card lands
    // between its visible neighbours.
    const columnIds = (grouped[newStatus] ?? []).map((f) => f.id);
    const overIndex = columnIds.indexOf(over.id as string);
    // A drop on the column itself rather than on a card lands at the bottom.
    const dropIndex = overIndex === -1 ? columnIds.length : overIndex;
    const target = resolveDropNeighbours(columnIds, feedbackId, dropIndex);
    const current = resolveDropNeighbours(
      columnIds,
      feedbackId,
      columnIds.indexOf(feedbackId),
    );
    if (
      target.beforeId === current.beforeId &&
      target.afterId === current.afterId
    ) {
      return;
    }

    moveFeedback(feedbackId, newStatus, target.beforeId, target.afterId);
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
      <div className="hidden lg:block">
        <BoardSummaryStrip
          columns={COLUMNS}
          feedback={filtered}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
        />
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
              isSortable={sort === "manual"}
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
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
