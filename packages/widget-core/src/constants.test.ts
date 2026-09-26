import { describe, expect, it } from "vitest";

import { DEFAULT_LABELS } from "./constants.js";

describe("DEFAULT_LABELS", () => {
  const { pinAriaLabel, ...textLabels } = DEFAULT_LABELS;

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

  it("uses no exclamation mark or em dash", () => {
    const values = [...Object.values(textLabels), pinAriaLabel("excerpt")];

    for (const value of values) {
      expect(value).not.toMatch(/[!—]/);
    }
  });
});
