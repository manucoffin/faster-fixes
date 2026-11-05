import { describe, expect, it } from "vitest";
import { describeVideoSelection } from "./describe-video-selection";

describe("describeVideoSelection", () => {
  it("phrases a point in percents of the frame", () => {
    expect(
      describeVideoSelection({ point: { x: 0.42, y: 0.61 }, area: null }),
    ).toBe("Point at 42%, 61%");
  });

  it("phrases an area by its two corners", () => {
    expect(
      describeVideoSelection({
        point: null,
        area: { x: 0.1, y: 0.2, width: 0.45, height: 0.5 },
      }),
    ).toBe("Area from (10%, 20%) to (55%, 70%)");
  });

  it("rounds to whole percents", () => {
    expect(
      describeVideoSelection({ point: { x: 0.4249, y: 0.6151 }, area: null }),
    ).toBe("Point at 42%, 62%");
  });

  it("returns null when the Reviewer marked time only", () => {
    expect(describeVideoSelection({ point: null, area: null })).toBeNull();
  });
});
