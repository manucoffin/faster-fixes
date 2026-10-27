import { describe, expect, it } from "vitest";

import { measureSelectionGeometry } from "./selection-geometry.js";

function elementAt(rect: Partial<DOMRect>) {
  return { getBoundingClientRect: () => rect } as Element;
}

describe("measureSelectionGeometry", () => {
  it("records the viewport, the element rectangle and the click in viewport pixels", () => {
    const element = elementAt({
      left: 40,
      top: 120.5,
      width: 200,
      height: 32,
      right: 240,
      bottom: 152.5,
    });

    expect(
      measureSelectionGeometry(
        element,
        { x: 90, y: 130 },
        { innerWidth: 1280, innerHeight: 720 },
      ),
    ).toEqual({
      viewport: { width: 1280, height: 720 },
      element: { left: 40, top: 120.5, width: 200, height: 32 },
      click: { x: 90, y: 130 },
    });
  });

  it("keeps a rectangle partly scrolled out of the viewport as measured", () => {
    const element = elementAt({ left: -10, top: -50, width: 100, height: 80 });

    expect(
      measureSelectionGeometry(
        element,
        { x: 5, y: 10 },
        { innerWidth: 800, innerHeight: 600 },
      ).element,
    ).toEqual({ left: -10, top: -50, width: 100, height: 80 });
  });
});
