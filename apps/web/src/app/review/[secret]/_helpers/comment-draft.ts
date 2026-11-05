import type { ReviewSelection } from "../_types/review-page-data";

/** A comment the Reviewer is composing: where it sits and what it says. */
export type CommentDraft = ReviewSelection & {
  startMs: number;
  endMs: number | null;
  comment: string;
};

// The API takes whole milliseconds no later than the Video's duration, so the
// playhead is floored rather than rounded up past the last frame.
function toWholeMs(playheadMs: number) {
  return Math.max(0, Math.floor(playheadMs));
}

/**
 * Moves the in point to the playhead, opening a draft when none is open. The
 * text and the marker stay; an out point no longer after the in point is
 * dropped, so the range turns back into an instant.
 */
export function anchorCommentDraft(
  draft: CommentDraft | null,
  playheadMs: number,
): CommentDraft {
  const startMs = toWholeMs(playheadMs);
  if (!draft) {
    return { startMs, endMs: null, point: null, area: null, comment: "" };
  }

  const endMs =
    draft.endMs !== null && draft.endMs > startMs ? draft.endMs : null;
  return { ...draft, startMs, endMs };
}

export function canMarkCommentDraftOut(
  draft: CommentDraft | null,
  playheadMs: number,
) {
  return draft !== null && toWholeMs(playheadMs) > draft.startMs;
}

/** Sets the out point at the playhead; a playhead not past the in point is ignored. */
export function markCommentDraftOut(
  draft: CommentDraft,
  playheadMs: number,
): CommentDraft {
  if (!canMarkCommentDraftOut(draft, playheadMs)) return draft;
  return { ...draft, endMs: toWholeMs(playheadMs) };
}

export function clearCommentDraftOut(draft: CommentDraft): CommentDraft {
  return { ...draft, endMs: null };
}
