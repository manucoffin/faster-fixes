import { describe, expect, it } from "vitest";
import { describeVideoFeedbackTime } from "./describe-video-feedback-time";

describe("describeVideoFeedbackTime", () => {
  it("phrases an instant to the millisecond", () => {
    expect(describeVideoFeedbackTime(12_340, null)).toBe("At 0:12.340");
  });

  it("phrases a range with both bounds", () => {
    expect(describeVideoFeedbackTime(41_000, 47_500)).toBe(
      "From 0:41.000 to 0:47.500",
    );
  });

  it("switches to hours past an hour", () => {
    expect(describeVideoFeedbackTime(3_723_500, null)).toBe("At 1:02:03.500");
  });
});
