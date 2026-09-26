import { describe, expect, it } from "vitest";

import {
  computePinAnchor,
  createPinPlacementMetadata,
  getPinAnchor,
  getPinPlacementMetadata,
  getViewportAnchoringKind,
} from "./pin-placement.js";

// A chain of stand-in elements, target first, each child of the next. The
// last one plays `document.documentElement`.
function createChain(positions: string[]) {
  const root = { parentElement: null } as unknown as Element;
  const ownerDocument = { documentElement: root };
  const elements: Element[] = [];
  let parent: Element | null = root;
  for (const position of [...positions].reverse()) {
    const element = {
      parentElement: parent,
      ownerDocument,
      dataset: { position },
    } as unknown as Element;
    elements.unshift(element);
    parent = element;
  }
  const readPosition = (element: Element) =>
    (element as unknown as { dataset: { position: string } }).dataset.position;
  return { target: elements[0] as Element, readPosition };
}

describe("computePinAnchor", () => {
  it("returns the click position as fractions of the element size", () => {
    expect(
      computePinAnchor(
        { left: 100, top: 50, width: 200, height: 100 },
        { x: 150, y: 125 },
      ),
    ).toEqual({ x: 0.25, y: 0.75 });
  });

  it("clamps a click outside the element to its edges", () => {
    expect(
      computePinAnchor(
        { left: 100, top: 50, width: 200, height: 100 },
        { x: 20, y: 400 },
      ),
    ).toEqual({ x: 0, y: 1 });
  });

  it("returns null for an element with no area", () => {
    expect(
      computePinAnchor(
        { left: 0, top: 0, width: 0, height: 20 },
        { x: 0, y: 0 },
      ),
    ).toBeNull();
  });
});

describe("getViewportAnchoringKind", () => {
  it("is normal when no ancestor is fixed or sticky", () => {
    const { target, readPosition } = createChain([
      "static",
      "relative",
      "absolute",
    ]);
    expect(getViewportAnchoringKind(target, readPosition)).toBe("normal");
  });

  it("reports the element's own fixed position", () => {
    const { target, readPosition } = createChain(["fixed", "static"]);
    expect(getViewportAnchoringKind(target, readPosition)).toBe("fixed");
  });

  it("reports a sticky ancestor", () => {
    const { target, readPosition } = createChain([
      "static",
      "relative",
      "sticky",
    ]);
    expect(getViewportAnchoringKind(target, readPosition)).toBe("sticky");
  });

  it("reports the nearest of several anchoring ancestors", () => {
    const { target, readPosition } = createChain(["static", "sticky", "fixed"]);
    expect(getViewportAnchoringKind(target, readPosition)).toBe("sticky");
  });
});

describe("createPinPlacementMetadata", () => {
  it("stores document mode with the scroll-adjusted point for a normal element", () => {
    expect(
      createPinPlacementMetadata("normal", { x: 10, y: 20 }, { x: 0, y: 300 }),
    ).toEqual({
      mode: "document",
      targetKind: "normal",
      documentPoint: { x: 10, y: 320 },
      viewportPoint: { x: 10, y: 20 },
    });
  });

  it.each(["fixed", "sticky"] as const)(
    "stores viewport mode for a %s element",
    (kind) => {
      expect(
        createPinPlacementMetadata(kind, { x: 5, y: 6 }, { x: 0, y: 100 }),
      ).toMatchObject({ mode: "viewport", targetKind: kind });
    },
  );
});

describe("reading stored metadata", () => {
  it("reads back what createPinPlacementMetadata stored", () => {
    const pinPlacement = createPinPlacementMetadata(
      "fixed",
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    );
    expect(getPinPlacementMetadata({ pinPlacement })).toEqual(pinPlacement);
  });

  it("clamps a stored pin anchor into the unit square", () => {
    expect(getPinAnchor({ pinAnchor: { x: 1.4, y: -0.2 } })).toEqual({
      x: 1,
      y: 0,
    });
  });

  it("ignores malformed metadata", () => {
    expect(getPinAnchor(null)).toBeNull();
    expect(getPinAnchor({ pinAnchor: { x: "1", y: 0 } })).toBeNull();
    expect(getPinPlacementMetadata({ pinPlacement: { mode: "page" } })).toBe(
      null,
    );
  });
});
