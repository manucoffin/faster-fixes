import { describe, expect, it } from "vitest";
import { readVideoSelection } from "./read-video-selection";

const none = {
  frameX: null,
  frameY: null,
  frameWidth: null,
  frameHeight: null,
};

describe("readVideoSelection", () => {
  it("reads a point from a position without a size", () => {
    expect(readVideoSelection({ ...none, frameX: 0.25, frameY: 0.5 })).toEqual({
      point: { x: 0.25, y: 0.5 },
      area: null,
    });
  });

  it("reads an area from a position with a size", () => {
    expect(
      readVideoSelection({
        frameX: 0.1,
        frameY: 0.2,
        frameWidth: 0.3,
        frameHeight: 0.4,
      }),
    ).toEqual({
      point: null,
      area: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
    });
  });

  it("reads neither when no frame column is set", () => {
    expect(readVideoSelection(none)).toEqual({ point: null, area: null });
  });
});
