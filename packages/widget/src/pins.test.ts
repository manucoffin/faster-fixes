import { describe, expect, it } from "vitest";

import { numberPins } from "./pins.js";

describe("numberPins", () => {
  it("numbers the pins from 1 in creation order, whatever the list order", () => {
    const numbers = numberPins([
      { id: "newest", createdAt: "2026-09-03T10:00:00.000Z" },
      { id: "oldest", createdAt: "2026-09-01T10:00:00.000Z" },
      { id: "middle", createdAt: "2026-09-02T10:00:00.000Z" },
    ]);

    expect([...numbers]).toEqual(
      expect.arrayContaining([
        ["oldest", 1],
        ["middle", 2],
        ["newest", 3],
      ]),
    );
  });

  it("keeps the list order between pins created at the same time", () => {
    const createdAt = "2026-09-01T10:00:00.000Z";
    const numbers = numberPins([
      { id: "first", createdAt },
      { id: "second", createdAt },
    ]);

    expect(numbers.get("first")).toBe(1);
    expect(numbers.get("second")).toBe(2);
  });
});
