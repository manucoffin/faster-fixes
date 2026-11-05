import { VideoSelectionSchema } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { describe, expect, it } from "vitest";
import {
  describeFrameMarker,
  readFrameGesture,
  toFramePosition,
} from "./read-frame-gesture";

const WIDE_FRAME = { width: 1920, height: 1080 };

function isValidSelection(selection: ReturnType<typeof readFrameGesture>) {
  return VideoSelectionSchema.safeParse({
    startMs: 0,
    endMs: null,
    ...selection,
  }).success;
}

describe("toFramePosition", () => {
  it("keeps the position when the box has the frame's ratio", () => {
    expect(
      toFramePosition({ x: 0.25, y: 0.75 }, WIDE_FRAME, {
        width: 160,
        height: 90,
      }),
    ).toEqual({ x: 0.25, y: 0.75 });
  });

  it("removes the bands above and below a frame wider than its box", () => {
    // A 16:9 frame in a square box fills its middle 56.25% vertically.
    expect(
      toFramePosition({ x: 0.5, y: 0.5 - 0.5625 / 4 }, WIDE_FRAME, {
        width: 100,
        height: 100,
      }),
    ).toEqual({ x: 0.5, y: 0.25 });
  });

  it("clamps a position in a band to the frame's edge", () => {
    expect(
      toFramePosition({ x: 0.5, y: 0.05 }, WIDE_FRAME, {
        width: 100,
        height: 100,
      }),
    ).toEqual({ x: 0.5, y: 0 });
  });
});

describe("readFrameGesture", () => {
  it("places a point where a click went down", () => {
    expect(readFrameGesture({ x: 0.3, y: 0.4 }, { x: 0.305, y: 0.4 })).toEqual({
      point: { x: 0.3, y: 0.4 },
      area: null,
    });
  });

  it("outlines the area a drag spans, whatever its direction", () => {
    expect(readFrameGesture({ x: 0.6, y: 0.7 }, { x: 0.2, y: 0.3 })).toEqual({
      point: null,
      area: {
        x: 0.2,
        y: expect.closeTo(0.3) as number,
        width: expect.closeTo(0.4) as number,
        height: expect.closeTo(0.4) as number,
      },
    });
  });

  it("gives a drag along one axis a minimal height", () => {
    const { area } = readFrameGesture({ x: 0.1, y: 0.5 }, { x: 0.5, y: 0.5 });
    expect(area?.height).toBe(0.01);
  });

  it("keeps a minimal area against the frame's far edge inside the frame", () => {
    const selection = readFrameGesture({ x: 0.5, y: 1 }, { x: 1, y: 1 });
    expect(selection.area?.y).toBe(0.99);
    expect(isValidSelection(selection)).toBe(true);
  });

  it("produces a Selection the shared schema accepts for a drag to the corner", () => {
    expect(
      isValidSelection(readFrameGesture({ x: 0.7, y: 0.9 }, { x: 1, y: 1 })),
    ).toBe(true);
  });
});

describe("describeFrameMarker", () => {
  it("names a point", () => {
    expect(describeFrameMarker({ point: { x: 0, y: 0 }, area: null })).toBe(
      "Point placed",
    );
  });

  it("names an area", () => {
    expect(
      describeFrameMarker({
        point: null,
        area: { x: 0, y: 0, width: 0.5, height: 0.5 },
      }),
    ).toBe("Area outlined");
  });

  it("returns null for a comment at a time only", () => {
    expect(describeFrameMarker({ point: null, area: null })).toBeNull();
  });
});
