import { WIDGET_POSITIONS } from "@fasterfixes/core";
import { describe, expect, it } from "vitest";

import { getPositionStyle } from "./position.js";

describe("getPositionStyle", () => {
  it.each([
    ["bottom-right", { bottom: "20px", right: "20px" }],
    ["bottom-left", { bottom: "20px", left: "20px" }],
    ["top-right", { top: "20px", right: "20px" }],
    ["top-left", { top: "20px", left: "20px" }],
    [
      "middle-right",
      { top: "50%", right: "20px", transform: "translateY(-50%)" },
    ],
    [
      "middle-left",
      { top: "50%", left: "20px", transform: "translateY(-50%)" },
    ],
  ] as const)("places %s", (position, style) => {
    expect(getPositionStyle(position)).toEqual(style);
  });

  it("covers every position core defines", () => {
    for (const position of WIDGET_POSITIONS) {
      expect(getPositionStyle(position)).not.toEqual({});
    }
  });

  it("returns a copy the caller can change", () => {
    getPositionStyle("top-left").top = "0px";

    expect(getPositionStyle("top-left").top).toBe("20px");
  });
});
