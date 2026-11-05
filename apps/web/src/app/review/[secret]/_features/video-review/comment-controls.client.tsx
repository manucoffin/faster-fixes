"use client";

import { Button } from "@workspace/ui/components/button";
import {
  canMarkCommentDraftOut,
  type CommentDraft,
} from "../../_helpers/comment-draft";
import { formatTimecode } from "@/app/_domains/video/_helpers/format-timecode";

type CommentControlsProps = {
  draft: CommentDraft | null;
  currentMs: number;
  onMarkIn: () => void;
  onMarkOut: () => void;
  onClearOut: () => void;
};

// Mark in opens a draft at the playhead when none is open, as "Comment at"
// does; with a draft open it only moves the in point.
export function CommentControls({
  draft,
  currentMs,
  onMarkIn,
  onMarkOut,
  onClearOut,
}: CommentControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={onMarkIn}>
        Mark in
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canMarkCommentDraftOut(draft, currentMs)}
        onClick={onMarkOut}
      >
        Mark out
      </Button>
      {draft && draft.endMs !== null ? (
        <Button type="button" size="sm" variant="ghost" onClick={onClearOut}>
          Clear out point
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        disabled={draft !== null}
        onClick={onMarkIn}
      >
        Comment at{" "}
        <span className="tabular-nums">{formatTimecode(currentMs)}</span>
      </Button>
    </div>
  );
}
