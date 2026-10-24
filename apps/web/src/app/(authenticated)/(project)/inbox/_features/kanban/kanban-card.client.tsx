"use client";

import { useSortable } from "@dnd-kit/sortable";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getWaitingDays, isWaitingTooLong } from "../../_helpers/board-summary";
import type { ListFeedbackOutput } from "../../_services/list-feedback";
import { getBoardStatusAppearance } from "./board-status-appearance";
import { AssigneeAvatar, TrackerChips, WaitingChip } from "./kanban-card-parts";

type FeedbackItem = ListFeedbackOutput[number];

type KanbanCardProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
  isDraggable: boolean;
  // Lets the other cards make room while dragging, which only the Manual sort
  // persists.
  isSortable: boolean;
  onToggleSelect: (id: string) => void;
  onSelect: (id: string) => void;
};

// The host is the same for every Feedback of a Project, so only the path helps.
function formatPagePath(url: string) {
  try {
    return new URL(url).pathname.replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
}

type KanbanCardViewProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
  isDraggable?: boolean;
  isOverlay?: boolean;
  isDragging?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelect?: (id: string) => void;
};

// Pure presentational card. Used as draggable source and inside DragOverlay.
function KanbanCardView({
  feedback,
  isSelected,
  isDraggable,
  isOverlay,
  isDragging,
  onToggleSelect,
  onSelect,
}: KanbanCardViewProps) {
  const appearance = getBoardStatusAppearance(feedback.status);
  const StatusIcon = appearance.icon;
  const now = new Date();
  const isWaiting = isWaitingTooLong(feedback, now);
  const hasTracker = [
    feedback.issueLink,
    feedback.linearIssueLink,
    feedback.jiraIssueLink,
  ].some(Boolean);

  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border border-border bg-card p-3 transition-[box-shadow,border-color] hover:border-foreground/20 hover:shadow-sm",
        // The open hand says the card moves; the hover lift says it opens.
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isOverlay && "cursor-grabbing shadow-lg",
        // Source stays in flow but invisible; DragOverlay shows the moving copy.
        isDragging && "invisible",
        isSelected && "border-primary/40 bg-primary/5 hover:border-primary/60",
      )}
      onClick={() => {
        if (isOverlay) return;
        onSelect?.(feedback.id);
      }}
    >
      <div
        className="flex items-start pt-0.5"
        onClick={(e) => e.stopPropagation()}
        // Keeps a press on the checkbox from starting a drag of the card.
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.(feedback.id)}
          aria-label="Select feedback"
        />
      </div>

      <StatusIcon
        className={cn("mt-0.5 size-4 shrink-0", appearance.iconClassName)}
      />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 text-sm leading-snug">{feedback.comment}</p>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {formatPagePath(feedback.pageUrl)}
        </p>

        {(isWaiting || hasTracker) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isWaiting && (
              <WaitingChip days={getWaitingDays(feedback.createdAt, now)} />
            )}
            <TrackerChips feedback={feedback} />
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">{feedback.reviewer.name}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">
            {formatDistanceToNow(feedback.createdAt, { addSuffix: true })}
          </span>
          <div className="ml-auto shrink-0">
            <AssigneeAvatar assignee={feedback.assignee} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function KanbanCard({
  feedback,
  isSelected,
  isDraggable,
  isSortable,
  onToggleSelect,
  onSelect,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: feedback.id,
    data: { status: feedback.status },
    disabled: !isDraggable,
  });

  const style =
    isSortable && transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transition,
        }
      : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCardView
        feedback={feedback}
        isSelected={isSelected}
        isDraggable={isDraggable}
        isDragging={isDragging}
        onToggleSelect={onToggleSelect}
        onSelect={onSelect}
      />
    </div>
  );
}

type KanbanCardOverlayProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
};

export function KanbanCardOverlay({
  feedback,
  isSelected,
}: KanbanCardOverlayProps) {
  return (
    <KanbanCardView feedback={feedback} isSelected={isSelected} isOverlay />
  );
}
