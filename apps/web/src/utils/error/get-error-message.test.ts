import { describe, expect, it } from "vitest";

import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("returns the message of an error", () => {
    expect(getErrorMessage(new Error("Project not found"))).toBe(
      "Project not found",
    );
  });

  it("falls back to the generic sentence for an error with no message", () => {
    expect(getErrorMessage(new Error("   "))).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("falls back to the generic sentence for a non-error value", () => {
    expect(getErrorMessage("boom")).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
