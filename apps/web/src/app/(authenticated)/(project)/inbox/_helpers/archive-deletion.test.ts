import { describe, expect, it } from "vitest";
import { getBulkDeleteNotice, getPageAfterDeletion } from "./archive-deletion";

describe("getBulkDeleteNotice", () => {
  it("confirms a single deletion", () => {
    expect(getBulkDeleteNotice({ deleted: 1, requested: 1 })).toEqual({
      tone: "success",
      message: "Feedback deleted.",
    });
  });

  it("counts a full deletion", () => {
    expect(getBulkDeleteNotice({ deleted: 15, requested: 15 })).toEqual({
      tone: "success",
      message: "15 feedback items deleted.",
    });
  });

  it("names how many were skipped in a partial deletion", () => {
    expect(getBulkDeleteNotice({ deleted: 12, requested: 15 })).toEqual({
      tone: "warning",
      message: "12 of 15 deleted. 3 were no longer archived.",
    });
    expect(getBulkDeleteNotice({ deleted: 2, requested: 3 }).message).toBe(
      "2 of 3 deleted. 1 was no longer archived.",
    );
  });

  it("reports a deletion that removed nothing", () => {
    expect(getBulkDeleteNotice({ deleted: 0, requested: 4 })).toEqual({
      tone: "error",
      message: "No feedback deleted. The selection was no longer archived.",
    });
  });
});

describe("getPageAfterDeletion", () => {
  it("keeps the page when it still has rows", () => {
    expect(
      getPageAfterDeletion({
        page: 2,
        pageSize: 20,
        totalCount: 45,
        deleted: 5,
      }),
    ).toBe(2);
  });

  it("steps back when the last page empties", () => {
    expect(
      getPageAfterDeletion({
        page: 3,
        pageSize: 20,
        totalCount: 45,
        deleted: 5,
      }),
    ).toBe(2);
  });

  it("falls back to the first page when the archive empties", () => {
    expect(
      getPageAfterDeletion({
        page: 1,
        pageSize: 20,
        totalCount: 3,
        deleted: 3,
      }),
    ).toBe(1);
  });
});
