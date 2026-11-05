import { describe, expect, it } from "vitest";
import {
  anchorCommentDraft,
  canMarkCommentDraftOut,
  clearCommentDraftOut,
  markCommentDraftOut,
  type CommentDraft,
} from "./comment-draft";

const draft: CommentDraft = {
  startMs: 1000,
  endMs: null,
  point: null,
  area: null,
  comment: "The logo jumps",
};

describe("anchorCommentDraft", () => {
  it("opens an empty instant draft at the playhead", () => {
    expect(anchorCommentDraft(null, 2500)).toEqual({
      startMs: 2500,
      endMs: null,
      point: null,
      area: null,
      comment: "",
    });
  });

  it("floors the playhead to whole milliseconds", () => {
    expect(anchorCommentDraft(null, 2500.9).startMs).toBe(2500);
  });

  it("moves the in point and keeps the text and the marker", () => {
    const marked = { ...draft, point: { x: 0.2, y: 0.4 } };

    expect(anchorCommentDraft(marked, 4000)).toEqual({
      ...marked,
      startMs: 4000,
    });
  });

  it("keeps an out point still after the new in point", () => {
    expect(anchorCommentDraft({ ...draft, endMs: 5000 }, 3000).endMs).toBe(
      5000,
    );
  });

  it("drops an out point no longer after the new in point", () => {
    expect(
      anchorCommentDraft({ ...draft, endMs: 5000 }, 5000).endMs,
    ).toBeNull();
  });
});

describe("canMarkCommentDraftOut", () => {
  it("is false without a draft", () => {
    expect(canMarkCommentDraftOut(null, 5000)).toBe(false);
  });

  it("is false when the playhead is at the in point", () => {
    expect(canMarkCommentDraftOut(draft, 1000.4)).toBe(false);
  });

  it("is true when the playhead is past the in point", () => {
    expect(canMarkCommentDraftOut(draft, 1001)).toBe(true);
  });
});

describe("markCommentDraftOut", () => {
  it("sets the out point at the playhead", () => {
    expect(markCommentDraftOut(draft, 3000.7).endMs).toBe(3000);
  });

  it("ignores a playhead before the in point", () => {
    expect(markCommentDraftOut(draft, 500)).toBe(draft);
  });
});

describe("clearCommentDraftOut", () => {
  it("turns a range back into an instant", () => {
    expect(clearCommentDraftOut({ ...draft, endMs: 3000 })).toEqual(draft);
  });
});
