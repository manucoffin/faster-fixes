import { describe, expect, it } from "vitest";
import { formatTimecode } from "./format-timecode";

describe("formatTimecode", () => {
  it("shows the start of the video as 0:00", () => {
    expect(formatTimecode(0)).toBe("0:00");
  });

  it("pads the seconds under a minute", () => {
    expect(formatTimecode(7_000)).toBe("0:07");
  });

  it("shows minutes and seconds under an hour", () => {
    expect(formatTimecode(83_000)).toBe("1:23");
  });

  it("drops the milliseconds rather than rounding up", () => {
    expect(formatTimecode(59_999)).toBe("0:59");
  });

  it("switches to h:mm:ss from one hour", () => {
    expect(formatTimecode(3_600_000)).toBe("1:00:00");
  });

  it("pads the minutes and seconds past an hour", () => {
    expect(formatTimecode(3_723_000)).toBe("1:02:03");
  });

  it("shows milliseconds for a range bound", () => {
    expect(formatTimecode(83_045, { milliseconds: true })).toBe("1:23.045");
  });

  it("shows milliseconds past an hour", () => {
    expect(formatTimecode(3_723_500, { milliseconds: true })).toBe(
      "1:02:03.500",
    );
  });

  it("floors a fractional playhead position", () => {
    expect(formatTimecode(1_234.9, { milliseconds: true })).toBe("0:01.234");
  });

  it("clamps a negative position to zero", () => {
    expect(formatTimecode(-500)).toBe("0:00");
  });
});
