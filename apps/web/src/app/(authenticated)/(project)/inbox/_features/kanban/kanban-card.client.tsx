"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { formatDistanceToNow } from "date-fns";
import { GripVertical } from "lucide-react";
import type { GetFeedbackOutput } from "../get-feedback.trpc.query";

type FeedbackItem = GetFeedbackOutput[number];

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

export function KanbanCard({
  feedback,
  isSelected,
  selectionMode,
  onToggleSelect,
  onSelect,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: feedback.id,
      data: { feedback },
    });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-card border-border flex cursor-pointer gap-2 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => {
        if (!isDragging) onSelect(feedback.id);
      }}
    >
      {selectionMode && (
        <div
          className="flex items-start pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(feedback.id)}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 text-sm leading-snug">{feedback.comment}</p>

        <p className="text-muted-foreground mt-1.5 truncate text-xs">
          {formatPageUrl(feedback.pageUrl)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          {feedback.assignee ? (
            <Avatar className="size-5">
              <AvatarImage src={feedback.assignee.image ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {feedback.assignee.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="bg-muted size-5 rounded-full" />
          )}

          <span className="text-muted-foreground truncate text-xs">
            {feedback.reviewer.name}
          </span>

          <span className="text-muted-foreground ml-auto shrink-0 text-xs">
            {formatDistanceToNow(new Date(feedback.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <div
        className="text-muted-foreground flex shrink-0 cursor-grab items-center opacity-0 transition-opacity group-hover:opacity-100"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </div>
    </div>
  );
}
