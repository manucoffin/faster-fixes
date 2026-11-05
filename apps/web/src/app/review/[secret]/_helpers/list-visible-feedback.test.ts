import { describe, expect, it } from "vitest";
import {
  isHiddenByDefault,
  listVisibleFeedback,
} from "./list-visible-feedback";

function item(
  id: string,
  status: "new" | "in_progress" | "resolved" | "closed",
  startMs: number,
  createdAt = "2026-11-01T10:00:00.000Z",
) {
  return { id, status, startMs, createdAt };
}

describe("listVisibleFeedback", () => {
  it("orders the list by in point", () => {
    const { visible } = listVisibleFeedback(
      [item("late", "new", 9_000), item("early", "new", 1_000)],
      false,
    );

    expect(visible.map((feedback) => feedback.id)).toEqual(["early", "late"]);
  });

  it("puts the earliest posted first when two share an in point", () => {
    const { visible } = listVisibleFeedback(
      [
        item("second", "new", 1_000, "2026-11-01T10:05:00.000Z"),
        item("first", "new", 1_000, "2026-11-01T10:00:00.000Z"),
      ],
      false,
    );

    expect(visible.map((feedback) => feedback.id)).toEqual(["first", "second"]);
  });

  it("hides resolved and archived Feedback and counts them", () => {
    const result = listVisibleFeedback(
      [
        item("open", "new", 0),
        item("working", "in_progress", 1_000),
        item("done", "resolved", 2_000),
        item("archived", "closed", 3_000),
      ],
      false,
    );

    expect(result.visible.map((feedback) => feedback.id)).toEqual([
      "open",
      "working",
    ]);
    expect(result.hiddenCount).toBe(2);
  });

  it("shows every Feedback when resolved is toggled on, and still counts the hidden", () => {
    const result = listVisibleFeedback(
      [item("done", "resolved", 2_000), item("open", "new", 0)],
      true,
    );

    expect(result.visible.map((feedback) => feedback.id)).toEqual([
      "open",
      "done",
    ]);
    expect(result.hiddenCount).toBe(1);
  });

  it("does not reorder the list it was given", () => {
    const items = [item("late", "new", 9_000), item("early", "new", 1_000)];

    listVisibleFeedback(items, false);

    expect(items.map((feedback) => feedback.id)).toEqual(["late", "early"]);
  });
});

describe("isHiddenByDefault", () => {
  it.each([
    ["new", false],
    ["in_progress", false],
    ["resolved", true],
    ["closed", true],
  ] as const)("%s is hidden by default: %s", (status, hidden) => {
    expect(isHiddenByDefault(status)).toBe(hidden);
  });
});
