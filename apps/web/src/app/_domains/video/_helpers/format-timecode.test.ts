import { describe, expect, it } from "vitest";
import { formatFeedbackTime, formatTimecode } from "./format-timecode";

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

describe("formatFeedbackTime", () => {
  it("shows an instant as its timecode", () => {
    expect(formatFeedbackTime(83_045, null)).toBe("1:23");
  });

  it("shows a range as both bounds to the millisecond", () => {
    expect(formatFeedbackTime(12_300, 15_000)).toBe("0:12.300 to 0:15.000");
  });

  it("shows a range to the second when milliseconds are turned off", () => {
    expect(formatFeedbackTime(12_300, 75_000, { milliseconds: false })).toBe(
      "0:12 to 1:15",
    );
  });
});
