import { describe, expect, it } from "vitest";

import { distributeIntoColumns } from "./distribute-into-columns";

describe("distributeIntoColumns", () => {
  it("fills columns left to right while heights are equal", () => {
    expect(distributeIntoColumns([10, 10, 10], 3)).toEqual([[0], [1], [2]]);
  });

  it("places each next item in the shortest column", () => {
    expect(distributeIntoColumns([100, 20, 30, 40, 10], 3)).toEqual([
      [0],
      [1, 3],
      [2, 4],
    ]);
  });

  it("puts everything in one column when there is only one", () => {
    expect(distributeIntoColumns([5, 7], 1)).toEqual([[0, 1]]);
  });
});
