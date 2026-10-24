import type { Over } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { readDropStatus } from "./board-drop-target";

function over(id: string, data?: Record<string, unknown>): Over {
  return {
    id,
    rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 },
    disabled: false,
    data: { current: data },
  };
}

describe("readDropStatus", () => {
  it("reads the Status of a column", () => {
    expect(readDropStatus(over("resolved", { status: "resolved" }))).toBe(
      "resolved",
    );
  });

  it("reads the Status of the column a hovered card sits in", () => {
    expect(readDropStatus(over("feedback-1", { status: "in_progress" }))).toBe(
      "in_progress",
    );
  });

  it("returns null without a target or a Status", () => {
    expect(readDropStatus(null)).toBeNull();
    expect(readDropStatus(over("feedback-1"))).toBeNull();
    expect(readDropStatus(over("feedback-1", { status: 3 }))).toBeNull();
  });
});
