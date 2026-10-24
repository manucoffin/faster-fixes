import { describe, expect, it } from "vitest";
import { getPageAfterRemoval } from "./archive-deletion";

describe("getPageAfterRemoval", () => {
  it("keeps the page when it still has rows", () => {
    expect(
      getPageAfterRemoval({
        page: 2,
        pageSize: 20,
        totalCount: 45,
        removed: 5,
      }),
    ).toBe(2);
  });

  it("steps back when the last page empties", () => {
    expect(
      getPageAfterRemoval({
        page: 3,
        pageSize: 20,
        totalCount: 45,
        removed: 5,
      }),
    ).toBe(2);
  });

  it("falls back to the first page when the archive empties", () => {
    expect(
      getPageAfterRemoval({
        page: 1,
        pageSize: 20,
        totalCount: 3,
        removed: 3,
      }),
    ).toBe(1);
  });
});
