import { describe, expect, it } from "vitest";
import { mapSelectionToBox } from "./map-selection-to-box";

const WIDE_FRAME = { width: 1920, height: 1080 };
const WIDE_BOX = { width: 160, height: 90 };

describe("mapSelectionToBox", () => {
  it("returns null when the Selection marks neither a point nor an area", () => {
    expect(
      mapSelectionToBox({ point: null, area: null }, WIDE_FRAME, WIDE_BOX),
    ).toBeNull();
  });

  it("places a point at its coordinates when the box has the frame's ratio", () => {
    expect(
      mapSelectionToBox(
        { point: { x: 0.25, y: 0.75 }, area: null },
        WIDE_FRAME,
        WIDE_BOX,
      ),
    ).toEqual({ kind: "point", left: 0.25, top: 0.75 });
  });

  it("keeps an area's position and size when the box has the frame's ratio", () => {
    expect(
      mapSelectionToBox(
        { point: null, area: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 } },
        WIDE_FRAME,
        WIDE_BOX,
      ),
    ).toEqual({ kind: "area", left: 0.1, top: 0.2, width: 0.5, height: 0.4 });
  });

  it("offsets a point by the bands above and below a wide frame in a square box", () => {
    // 16:9 in a square: the frame fills the width and 56.25% of the height.
    const geometry = mapSelectionToBox(
      { point: { x: 0.5, y: 0 }, area: null },
      WIDE_FRAME,
      { width: 100, height: 100 },
    );

    expect(geometry).toEqual({ kind: "point", left: 0.5, top: 0.21875 });
  });

  it("scales an area into the side bands of a portrait frame in a wide box", () => {
    // 9:16 in a 16:9 box: the frame fills the height and 31.640625% of the width.
    const geometry = mapSelectionToBox(
      { point: null, area: { x: 0, y: 0.5, width: 1, height: 0.5 } },
      { width: 1080, height: 1920 },
      WIDE_BOX,
    );

    expect(geometry).toEqual({
      kind: "area",
      left: 0.341796875,
      top: 0.5,
      width: 0.31640625,
      height: 0.5,
    });
  });

  it("prefers the area when both are present", () => {
    const geometry = mapSelectionToBox(
      {
        point: { x: 0.5, y: 0.5 },
        area: { x: 0, y: 0, width: 1, height: 1 },
      },
      WIDE_FRAME,
      WIDE_BOX,
    );

    expect(geometry?.kind).toBe("area");
  });
});
