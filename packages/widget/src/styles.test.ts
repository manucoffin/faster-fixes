import { describe, expect, it } from "vitest";

import { accentRule } from "./styles.js";

describe("accentRule", () => {
  it("sets the accent custom property on the host", () => {
    expect(accentRule("#16a34a")).toBe(":host { --ff-accent: #16a34a; }");
  });

  it.each(["red; } * { display: none", "red }", "{ red"])(
    "drops a value that would escape the declaration: %s",
    (color) => {
      expect(accentRule(color)).toBe("");
    },
  );
});
