import { describe, expect, it } from "vitest";

import { DEFAULT_LABELS } from "./constants.js";

describe("DEFAULT_LABELS", () => {
  const { pinAriaLabel, recordingIncluded, ...textLabels } = DEFAULT_LABELS;

  it.each(Object.entries(textLabels))(
    "%s is a non-empty string",
    (_, value) => {
      expect(typeof value).toBe("string");
      expect(value.trim()).not.toBe("");
    },
  );

  it("interpolates the comment excerpt into the pin aria-label", () => {
    expect(pinAriaLabel("Button overlaps the footer")).toBe(
      "Feedback: Button overlaps the footer",
    );
  });

  it.each([
    [1, "Includes the last second on this page."],
    [3, "Includes the last 3 seconds on this page."],
    [29, "Includes the last 29 seconds on this page."],
    [30, "Includes the last minute on this page."],
    [60, "Includes the last minute on this page."],
  ])("states a %s second Recording as %j", (seconds, line) => {
    expect(recordingIncluded(seconds)).toBe(line);
  });

  it("uses no exclamation mark or em dash", () => {
    const values = [
      ...Object.values(textLabels),
      pinAriaLabel("excerpt"),
      recordingIncluded(3),
      recordingIncluded(60),
    ];

    for (const value of values) {
      expect(value).not.toMatch(/[!—]/);
    }
  });
});
