"use client";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { XIcon } from "lucide-react";
import type { CommentDraft } from "../../_helpers/comment-draft";
import { formatFeedbackTime } from "@/app/_domains/video/_helpers/format-timecode";
import { describeFrameMarker } from "../../_helpers/read-frame-gesture";

type FeedbackComposerProps = {
  draft: CommentDraft;
  isPosting: boolean;
  onCommentChange: (comment: string) => void;
  onDiscard: () => void;
  onPost: () => void;
};

export function FeedbackComposer({
  draft,
  isPosting,
  onCommentChange,
  onDiscard,
  onPost,
}: FeedbackComposerProps) {
  const markerKind = describeFrameMarker(draft);

  return (
    <form
      aria-label="New comment"
      className="space-y-2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
      onSubmit={(event) => {
        event.preventDefault();
        onPost();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDiscard();
      }}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-medium tabular-nums">
          {formatFeedbackTime(draft.startMs, draft.endMs)}
        </span>
        {markerKind ? (
          <span className="text-muted-foreground">{markerKind}</span>
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto size-6"
          onClick={onDiscard}
          aria-label="Discard comment"
        >
          <XIcon />
        </Button>
      </div>
      <Textarea
        value={draft.comment}
        onChange={(event) => onCommentChange(event.target.value)}
        placeholder="What should change here?"
        rows={3}
        maxLength={5000}
        autoFocus
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isPosting || !draft.comment.trim()}
        >
          {isPosting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
