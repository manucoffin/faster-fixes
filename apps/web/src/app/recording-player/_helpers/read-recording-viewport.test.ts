import { describe, expect, it } from "vitest";

import { readRecordingViewport } from "./read-recording-viewport";

const META = { type: 4, timestamp: 1_000, data: { width: 1280, height: 720 } };
const SNAPSHOT = { type: 2, timestamp: 1_001, data: { node: {} } };
const CLICK = { type: 3, timestamp: 2_000, data: { source: 2 } };

describe("readRecordingViewport", () => {
  it("returns the recorded viewport of a playable Recording", () => {
    expect(readRecordingViewport([META, SNAPSHOT, CLICK])).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it.each([
    ["no events", []],
    ["a single event", [META]],
    ["no snapshot of the page", [META, CLICK]],
    ["no viewport", [SNAPSHOT, CLICK]],
    [
      "a viewport without a height",
      [{ ...META, data: { width: 1280 } }, SNAPSHOT],
    ],
    [
      "an empty viewport",
      [{ ...META, data: { width: 0, height: 720 } }, SNAPSHOT],
    ],
    ["a viewport of text", [{ ...META, data: "1280x720" }, SNAPSHOT]],
  ])("returns null for %s", (_, events) => {
    expect(readRecordingViewport(events)).toBeNull();
  });
});
