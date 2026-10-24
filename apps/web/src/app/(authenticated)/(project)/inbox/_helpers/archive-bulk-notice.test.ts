import { describe, expect, it } from "vitest";
import { getArchiveBulkNotice } from "./archive-bulk-notice";

describe("getArchiveBulkNotice", () => {
  it("confirms a single deletion", () => {
    expect(
      getArchiveBulkNotice({ action: "deleted", count: 1, requested: 1 }),
    ).toEqual({ tone: "success", message: "Feedback deleted." });
  });

  it("counts a full restore", () => {
    expect(
      getArchiveBulkNotice({ action: "restored", count: 15, requested: 15 }),
    ).toEqual({ tone: "success", message: "15 feedback items restored." });
  });

  it("names how many were skipped in a partial action", () => {
    expect(
      getArchiveBulkNotice({ action: "deleted", count: 12, requested: 15 }),
    ).toEqual({
      tone: "warning",
      message: "12 of 15 deleted. 3 were no longer archived.",
    });
    expect(
      getArchiveBulkNotice({ action: "restored", count: 2, requested: 3 })
        .message,
    ).toBe("2 of 3 restored. 1 was no longer archived.");
  });

  it("reports an action that touched nothing", () => {
    expect(
      getArchiveBulkNotice({ action: "restored", count: 0, requested: 4 }),
    ).toEqual({
      tone: "error",
      message: "No feedback restored. The selection was no longer archived.",
    });
  });
});
