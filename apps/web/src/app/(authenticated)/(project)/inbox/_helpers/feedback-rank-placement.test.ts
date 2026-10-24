import { describe, expect, it } from "vitest";
import { sortColumnFeedback } from "./board-column-order";
import { planRankPlacement } from "./feedback-rank-placement";

function feedback(id: string, rank: string | null, createdAt = "2026-10-01") {
  return {
    id,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    rank,
  };
}

type Item = ReturnType<typeof feedback>;

// Applies the writes and returns the column in the Manual order.
function orderAfter(
  column: Item[],
  movedId: string,
  beforeId: string | null,
  afterId: string | null,
) {
  const writes = planRankPlacement({ column, movedId, beforeId, afterId });
  const keys = new Map(writes.map((w) => [w.feedbackId, w.key]));
  const next = column.map((f) => ({ ...f, rank: keys.get(f.id) ?? f.rank }));
  return sortColumnFeedback(next, "manual").map((f) => f.id);
}

describe("planRankPlacement", () => {
  const ranked = [
    feedback("a", "a0"),
    feedback("b", "a1"),
    feedback("c", "a2"),
  ];

  it("places the card between two ranked neighbours with one write", () => {
    const column = [...ranked, feedback("moved", "a3")];

    expect(
      planRankPlacement({
        column,
        movedId: "moved",
        beforeId: "a",
        afterId: "b",
      }),
    ).toHaveLength(1);
    expect(orderAfter(column, "moved", "a", "b")).toEqual([
      "a",
      "moved",
      "b",
      "c",
    ]);
  });

  it("places the card at the top and at the bottom", () => {
    const column = [...ranked, feedback("moved", "a3")];

    expect(orderAfter(column, "moved", null, "a")).toEqual([
      "moved",
      "a",
      "b",
      "c",
    ]);
    expect(orderAfter(column, "moved", "c", null)).toEqual([
      "a",
      "b",
      "c",
      "moved",
    ]);
  });

  it("places the card in an empty column", () => {
    const writes = planRankPlacement({
      column: [feedback("moved", null)],
      movedId: "moved",
      beforeId: null,
      afterId: null,
    });

    expect(writes).toEqual([{ feedbackId: "moved", key: expect.any(String) }]);
  });

  it("keeps the displayed order when dropped among unranked cards", () => {
    const column = [
      ...ranked,
      feedback("old", null, "2026-10-01"),
      feedback("recent", null, "2026-10-03"),
      feedback("moved", "a3"),
    ];

    expect(orderAfter(column, "moved", null, "recent")).toEqual([
      "moved",
      "recent",
      "old",
      "a",
      "b",
      "c",
    ]);
    expect(orderAfter(column, "moved", "recent", "old")).toEqual([
      "recent",
      "moved",
      "old",
      "a",
      "b",
      "c",
    ]);
    expect(orderAfter(column, "moved", "old", "a")).toEqual([
      "recent",
      "old",
      "moved",
      "a",
      "b",
      "c",
    ]);
  });

  it("lands between the visible neighbours when hidden cards sit between them", () => {
    const column = [...ranked, feedback("moved", "a3")];

    // Under a page filter only a and c are visible.
    expect(orderAfter(column, "moved", "a", "c")).toEqual([
      "a",
      "moved",
      "b",
      "c",
    ]);
  });

  it("falls back on the other neighbour when one left the column", () => {
    const column = [...ranked, feedback("moved", "a3")];

    expect(orderAfter(column, "moved", "gone", "b")).toEqual([
      "a",
      "moved",
      "b",
      "c",
    ]);
  });

  it("stays valid when two neighbours share a key", () => {
    const column = [
      feedback("a", "a0"),
      feedback("b", "a0"),
      feedback("c", "a1"),
      feedback("moved", "a2"),
    ];

    expect(orderAfter(column, "moved", "a", "b")).toEqual([
      "a",
      "b",
      "moved",
      "c",
    ]);
  });
});
