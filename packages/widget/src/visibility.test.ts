import { describe, expect, it } from "vitest";

import { shouldMount } from "./visibility.js";

describe("shouldMount", () => {
  it("mounts with a token and an enabled config", () => {
    expect(shouldMount("tok", { enabled: true, branding: false })).toBe(true);
  });

  it.each([
    ["no token", null, { enabled: true, branding: false }],
    ["an empty token", "", { enabled: true, branding: false }],
    ["a disabled config", "tok", { enabled: false, branding: true }],
    ["no config", "tok", null],
  ])("stays hidden with %s", (_case, token, config) => {
    expect(shouldMount(token, config)).toBe(false);
  });
});
