import { describe, expect, it } from "vitest";
import { sortColumnFeedback } from "./board-column-order";

function feedback(
  id: string,
  {
    createdAt = "2026-10-01T00:00:00Z",
    updatedAt = createdAt,
    rank = null,
  }: { createdAt?: string; updatedAt?: string; rank?: string | null } = {},
) {
  return {
    id,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    rank,
  };
}

function ids(items: { id: string }[]) {
  return items.map((item) => item.id);
}

describe("sortColumnFeedback in the manual sort", () => {
  it("places unranked Feedback above ranked Feedback, newest first", () => {
    const items = [
      feedback("ranked", { createdAt: "2026-10-05T00:00:00Z", rank: "a0" }),
      feedback("old", { createdAt: "2026-10-01T00:00:00Z" }),
      feedback("recent", { createdAt: "2026-10-03T00:00:00Z" }),
    ];

    expect(ids(sortColumnFeedback(items, "manual"))).toEqual([
      "recent",
      "old",
      "ranked",
    ]);
  });

  it("orders ranked Feedback by key, whatever its dates", () => {
    const items = [
      feedback("second", { createdAt: "2026-10-01T00:00:00Z", rank: "a1" }),
      feedback("third", { createdAt: "2026-10-09T00:00:00Z", rank: "a1V" }),
      feedback("first", { createdAt: "2026-10-05T00:00:00Z", rank: "a0" }),
    ];

    expect(ids(sortColumnFeedback(items, "manual"))).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("compares keys by code unit, so an uppercase digit sorts before a lowercase one", () => {
    const items = [
      feedback("lower", { rank: "a0a" }),
      feedback("upper", { rank: "a0Z" }),
    ];

    expect(ids(sortColumnFeedback(items, "manual"))).toEqual([
      "upper",
      "lower",
    ]);
  });

  it("breaks a tie between equal keys by id", () => {
    const items = [
      feedback("b", { rank: "a0" }),
      feedback("a", { rank: "a0" }),
    ];

    expect(ids(sortColumnFeedback(items, "manual"))).toEqual(["a", "b"]);
  });

  it("does not reorder the input array", () => {
    const items = [feedback("ranked", { rank: "a0" }), feedback("unranked")];

    sortColumnFeedback(items, "manual");

    expect(ids(items)).toEqual(["ranked", "unranked"]);
  });
});

describe("sortColumnFeedback in the date sorts", () => {
  const items = [
    feedback("middle", {
      createdAt: "2026-10-02T00:00:00Z",
      updatedAt: "2026-10-09T00:00:00Z",
      rank: "a0",
    }),
    feedback("oldest", {
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-04T00:00:00Z",
    }),
    feedback("newest", {
      createdAt: "2026-10-03T00:00:00Z",
      updatedAt: "2026-10-03T00:00:00Z",
      rank: "Zz",
    }),
  ];

  it("orders by creation date, newest first, ignoring the Rank", () => {
    expect(ids(sortColumnFeedback(items, "newest"))).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("orders by creation date, oldest first", () => {
    expect(ids(sortColumnFeedback(items, "oldest"))).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
  });

  it("orders by last update, most recent first", () => {
    expect(ids(sortColumnFeedback(items, "updated"))).toEqual([
      "middle",
      "oldest",
      "newest",
    ]);
  });
});
