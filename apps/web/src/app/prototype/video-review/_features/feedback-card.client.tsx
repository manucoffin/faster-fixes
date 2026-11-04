"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { formatTimecode } from "../_helpers/format-timecode";
import { SelectionMarker } from "./frame-overlay.client";
import type { FeedbackStatus, ReviewFeedback } from "./use-video-review";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

export function formatSelectionTime(selection: ReviewFeedback["selection"]) {
  return selection.endMs !== null
    ? `${formatTimecode(selection.startMs)} to ${formatTimecode(selection.endMs)}`
    : formatTimecode(selection.startMs);
}

type FeedbackCardProps = {
  feedback: ReviewFeedback;
  active: boolean;
  canEdit: boolean;
  isOwn: boolean;
  onSelect: () => void;
  onEdit: (message: string) => void;
  onDelete: () => void;
  /** Hides the captured frame, for the variants that show it elsewhere. */
  hideThumbnail?: boolean;
  className?: string;
};

// What a comment looks like to a Reviewer, and the preview of what the
// dashboard shows: the captured frame with the Selection drawn over it.
export function FeedbackCard({
  feedback,
  active,
  canEdit,
  isOwn,
  onSelect,
  onEdit,
  onDelete,
  hideThumbnail = false,
  className,
}: FeedbackCardProps) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(feedback.message);
  const { selection } = feedback;

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-3 text-card-foreground transition-colors",
        active ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={onSelect}
      >
        {hideThumbnail ? null : (
          <FrameThumbnail
            screenshot={feedback.screenshot}
            selection={selection}
          />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-mono font-medium tabular-nums">
              {formatSelectionTime(selection)}
            </span>
            <span className="text-muted-foreground">
              {isOwn ? "You" : feedback.reviewerName}
            </span>
            <Badge
              variant={feedback.status === "resolved" ? "outline" : "secondary"}
              className="ml-auto"
            >
              {STATUS_LABEL[feedback.status]}
            </Badge>
          </div>
          {editing ? null : (
            <p className="text-sm leading-snug">{feedback.message}</p>
          )}
        </div>
      </button>

      {editing ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            onEdit(message);
            setEditing(false);
          }}
        >
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setMessage(feedback.message);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      ) : null}

      {!editing && canEdit ? (
        <div className="mt-1 flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </article>
  );
}

type FrameThumbnailProps = {
  screenshot: string | null;
  selection: ReviewFeedback["selection"];
};

function FrameThumbnail({ screenshot, selection }: FrameThumbnailProps) {
  const hasMarker = selection.point !== null || selection.area !== null;
  return (
    <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded bg-black">
      {screenshot ? (
        <Image
          src={screenshot}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] text-white/60">
          {hasMarker ? "frame" : "no frame"}
        </div>
      )}
      {hasMarker ? (
        <SelectionMarker selection={selection} className="border" />
      ) : null}
    </div>
  );
}
