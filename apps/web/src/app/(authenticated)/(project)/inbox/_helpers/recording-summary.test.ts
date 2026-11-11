import { describe, expect, it } from "vitest";
import { formatRecordingSummary } from "./recording-summary";

describe("formatRecordingSummary", () => {
  it("prints both counts", () => {
    expect(
      formatRecordingSummary({ consoleErrors: 2, failedRequests: 1 }),
    ).toBe("2 console errors, 1 failed request");
  });

  it("prints the one count that is not zero", () => {
    expect(
      formatRecordingSummary({ consoleErrors: 0, failedRequests: 3 }),
    ).toBe("3 failed requests");
    expect(
      formatRecordingSummary({ consoleErrors: 1, failedRequests: 0 }),
    ).toBe("1 console error");
  });

  it("prints nothing when there is nothing to count", () => {
    expect(
      formatRecordingSummary({ consoleErrors: 0, failedRequests: 0 }),
    ).toBeNull();
  });
});
