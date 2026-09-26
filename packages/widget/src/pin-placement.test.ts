import { describe, expect, it, vi } from "vitest";

import {
  computePinAnchor,
  createPinPlacementMetadata,
  getPinAnchor,
  getPinPlacementMetadata,
  getViewportAnchoringKind,
  PIN_DOT_SIZE,
  PIN_HEIGHT,
  placePin,
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

describe("placePin", () => {
  const view = { width: 1000, height: 800, scrollX: 0, scrollY: 0 };
  const rect = { left: 100, top: 200, width: 200, height: 100 };
  const normal = () => "normal" as const;

  function onElement(
    metadata: unknown,
    target: Partial<{ rect: typeof rect; kind: "normal" | "fixed" }> = {},
    pinView = view,
  ) {
    return placePin(
      { clickX: null, clickY: null, metadata },
      {
        rect: target.rect ?? rect,
        readTargetKind: () => target.kind ?? "normal",
      },
      pinView,
    );
  }

  it("centres the dot on the stored anchor", () => {
    expect(onElement({ pinAnchor: { x: 0.5, y: 0.5 } })).toEqual({
      mode: "document",
      left: 200,
      top: 250,
      side: "right",
    });
  });

  it("uses the top right corner for a pin stored without an anchor", () => {
    expect(onElement(null)).toEqual({
      mode: "document",
      left: 300,
      top: 200,
      side: "right",
    });
  });

  it("puts the label on the left when it would overflow on the right", () => {
    const edge = { left: 900, top: 200, width: 100, height: 100 };
    expect(onElement({ pinAnchor: { x: 0.9, y: 0 } }, { rect: edge })).toEqual(
      expect.objectContaining({ left: 990, side: "left" }),
    );
  });

  it("keeps the label on the right when the left has even less room", () => {
    const narrow = { ...view, width: 375 };
    const near = { left: 50, top: 200, width: 100, height: 100 };
    expect(
      onElement({ pinAnchor: { x: 0.5, y: 0 } }, { rect: near }, narrow),
    ).toEqual(expect.objectContaining({ left: 100, side: "right" }));
  });

  it("clamps the dot inside the viewport width", () => {
    const offscreen = { left: -300, top: 200, width: 100, height: 100 };
    expect(
      onElement({ pinAnchor: { x: 0, y: 0 } }, { rect: offscreen }),
    ).toEqual(expect.objectContaining({ left: PIN_DOT_SIZE / 2 }));
  });

  it("moves an anchorless pin up to the element's bottom when it overflows", () => {
    const low = { left: 100, top: 790, width: 100, height: 8 };
    expect(onElement(null, { rect: low })).toEqual(
      expect.objectContaining({ top: 798 - PIN_HEIGHT / 2 }),
    );
  });

  it("adds the scroll offset in document mode", () => {
    const scrolled = { ...view, scrollX: 10, scrollY: 500 };
    expect(onElement({ pinAnchor: { x: 0, y: 0 } }, {}, scrolled)).toEqual({
      mode: "document",
      left: 100 + 10,
      top: 200 + 500,
      side: "right",
    });
  });

  it("stays in viewport coordinates and clamps vertically for a fixed element", () => {
    const scrolled = { ...view, scrollY: 500 };
    const top = { left: 100, top: 0, width: 200, height: 40 };
    expect(
      onElement(
        { pinAnchor: { x: 0, y: 0 } },
        { rect: top, kind: "fixed" },
        scrolled,
      ),
    ).toEqual({
      mode: "viewport",
      left: 100,
      top: PIN_HEIGHT / 2,
      side: "right",
    });
  });

  it("prefers the stored placement over the element's current kind", () => {
    const readTargetKind = vi.fn(normal);
    const pinPlacement = { mode: "viewport", targetKind: "sticky" };
    expect(
      placePin(
        { clickX: null, clickY: null, metadata: { pinPlacement } },
        { rect, readTargetKind },
        view,
      ),
    ).toEqual(expect.objectContaining({ mode: "viewport" }));
    expect(readTargetKind).not.toHaveBeenCalled();
  });

  it("hides the pin of an element with no box", () => {
    const empty = { left: 0, top: 0, width: 0, height: 0 };
    expect(onElement(null, { rect: empty })).toBeNull();
  });

  describe("without an element", () => {
    it("hides a pin stored with selector strategies", () => {
      expect(
        placePin(
          { clickX: 10, clickY: 20, metadata: { selectors: { css: "h1" } } },
          null,
          view,
        ),
      ).toBeNull();
    });

    it("falls back to the stored document point", () => {
      const pinPlacement = {
        mode: "document",
        documentPoint: { x: 10, y: 900 },
      };
      expect(
        placePin({ clickX: 10, clickY: 20, metadata: { pinPlacement } }, null, {
          ...view,
          scrollY: 880,
        }),
      ).toEqual({ mode: "document", left: 10, top: 900, side: "right" });
    });

    it("falls back to the click coordinates", () => {
      expect(placePin({ clickX: 10, clickY: 20 }, null, view)).toEqual({
        mode: "viewport",
        left: 10,
        top: 20,
        side: "right",
      });
    });

    it("hides a pin with nothing to place it by", () => {
      expect(placePin({ clickX: null, clickY: 20 }, null, view)).toBeNull();
    });
  });
});
