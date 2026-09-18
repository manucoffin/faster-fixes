"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import { cn } from "@workspace/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { GripVertical } from "lucide-react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type FeedbackItem = ListFeedbackOutput[number];

type KanbanCardProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: (id: string) => void;
  onSelect: (id: string) => void;
};

function formatPageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

type KanbanCardViewProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
  selectionMode: boolean;
  isOverlay?: boolean;
  isDragging?: boolean;
  dragHandle?: React.ReactNode;
  onToggleSelect?: (id: string) => void;
  onSelect?: (id: string) => void;
};

// Pure presentational card. Used as draggable source and inside DragOverlay.
function KanbanCardView({
  feedback,
  isSelected,
  selectionMode,
  isOverlay,
  isDragging,
  dragHandle,
  onToggleSelect,
  onSelect,
}: KanbanCardViewProps) {
  return (
    <div
      className={cn(
        "group flex cursor-pointer gap-2 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm",
        isOverlay && "cursor-grabbing shadow-lg",
        // Source stays in flow but invisible; DragOverlay shows the moving copy.
        isDragging && "invisible",
      )}
      onClick={() => {
        if (isOverlay) return;
        onSelect?.(feedback.id);
      }}
    >
      {selectionMode && (
        <div
          className="flex items-start pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(feedback.id)}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 text-sm leading-snug">{feedback.comment}</p>

        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          {formatPageUrl(feedback.pageUrl)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {feedback.assignee ? (
            <Avatar className="size-5">
              <AvatarImage
                src={
                  feedback.assignee.image
                    ? resolveS3Url(feedback.assignee.image)
                    : undefined
                }
                className="object-cover"
              />
              <AvatarFallback className="text-[10px]">
                {feedback.assignee.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-5 rounded-full bg-muted" />
          )}

          <span className="truncate text-xs text-muted-foreground">
            {feedback.reviewer.name}
          </span>

          {feedback.issueLink && (
            <GithubIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}

          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(feedback.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {dragHandle}
    </div>
  );
}

export function KanbanCard({
  feedback,
  isSelected,
  selectionMode,
  onToggleSelect,
  onSelect,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: feedback.id,
    data: { feedback },
  });

  const handle = (
    <div
      className="hidden shrink-0 cursor-grab items-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 lg:flex"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="size-4" />
    </div>
  );

  return (
    <div ref={setNodeRef}>
      <KanbanCardView
        feedback={feedback}
        isSelected={isSelected}
        selectionMode={selectionMode}
        isDragging={isDragging}
        dragHandle={handle}
        onToggleSelect={onToggleSelect}
        onSelect={onSelect}
      />
    </div>
  );
}

type KanbanCardOverlayProps = {
  feedback: FeedbackItem;
  isSelected: boolean;
  selectionMode: boolean;
};

export function KanbanCardOverlay({
  feedback,
  isSelected,
  selectionMode,
}: KanbanCardOverlayProps) {
  return (
    <KanbanCardView
      feedback={feedback}
      isSelected={isSelected}
      selectionMode={selectionMode}
      isOverlay
    />
  );
}
