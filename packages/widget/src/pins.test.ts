import { describe, expect, it } from "vitest";

import { numberPins, readPinArea } from "./pins.js";

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

describe("readPinArea", () => {
  const container = { left: 100, top: 50, width: 400, height: 200 };

  it("places the area at its anchor in the container's current box", () => {
    const area = readPinArea(
      {
        pinAnchor: { x: 0.25, y: 0.5 },
        selection: {
          viewport: { width: 1280, height: 720 },
          area: { left: 10, top: 10, width: 80, height: 40 },
        },
      },
      container,
    );

    expect(area).toEqual({ left: 200, top: 150, width: 80, height: 40 });
  });

  it("returns null for an element Selection", () => {
    expect(
      readPinArea(
        {
          pinAnchor: { x: 0.5, y: 0.5 },
          selection: {
            viewport: { width: 1280, height: 720 },
            element: { left: 0, top: 0, width: 10, height: 10 },
            click: { x: 5, y: 5 },
          },
        },
        container,
      ),
    ).toBeNull();
  });

  it("returns null without a pin anchor", () => {
    expect(
      readPinArea(
        { selection: { area: { left: 0, top: 0, width: 80, height: 40 } } },
        container,
      ),
    ).toBeNull();
  });
});
