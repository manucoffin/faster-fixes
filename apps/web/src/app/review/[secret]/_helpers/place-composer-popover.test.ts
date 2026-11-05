import { describe, expect, it } from "vitest";
import { placeComposerPopover } from "./place-composer-popover";

const BOX = { width: 800, height: 450 };
const POPOVER = { width: 320, height: 180 };

describe("placeComposerPopover", () => {
  it("opens below and to the right of a point with room on both axes", () => {
    expect(
      placeComposerPopover(
        { kind: "point", left: 0.25, top: 0.2 },
        BOX,
        POPOVER,
      ),
    ).toEqual({ left: 212, top: 102 });
  });

  it("flips to the left of a point near the right edge", () => {
    expect(
      placeComposerPopover({ kind: "point", left: 0.9, top: 0.2 }, BOX, POPOVER)
        .left,
    ).toBe(720 - 12 - 320);
  });

  it("flips above a point near the bottom edge", () => {
    expect(
      placeComposerPopover(
        { kind: "point", left: 0.25, top: 0.9 },
        BOX,
        POPOVER,
      ).top,
    ).toBe(405 - 12 - 180);
  });

  it("anchors an area at its top-right corner", () => {
    expect(
      placeComposerPopover(
        { kind: "area", left: 0.125, top: 0.2, width: 0.25, height: 0.25 },
        BOX,
        POPOVER,
      ),
    ).toEqual({ left: 312, top: 102 });
  });

  it("pins the popover inside a box too small for either side", () => {
    expect(
      placeComposerPopover(
        { kind: "point", left: 0.5, top: 0.5 },
        { width: 400, height: 225 },
        POPOVER,
      ),
    ).toEqual({ left: 80, top: 45 });
  });
});
