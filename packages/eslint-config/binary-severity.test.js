import { describe, expect, it } from "vitest";

import { config as baseConfig } from "./base.js";
import { nextJsConfig } from "./next.js";
import { config as reactInternalConfig } from "./react-internal.js";
import { withBinarySeverity } from "./severity.js";

const EXPORTED_CONFIGS = {
  base: baseConfig,
  "next-js": nextJsConfig,
  "react-internal": reactInternalConfig,
};

function isWarn(entry) {
  const severity = Array.isArray(entry) ? entry[0] : entry;
  return severity === "warn" || severity === 1;
}

describe("binary severity", () => {
  it.each(Object.entries(EXPORTED_CONFIGS))(
    "%s declares no rule at warn",
    (_name, configs) => {
      const warned = configs.flatMap((entry) =>
        Object.entries(entry.rules ?? {})
          .filter(([, value]) => isWarn(value))
          .map(([rule]) => rule),
      );

      expect(warned).toEqual([]);
    },
  );

  it.each(Object.entries(EXPORTED_CONFIGS))(
    "%s reports an unused disable directive as an error",
    (_name, configs) => {
      const settings = configs
        .map((entry) => entry.linterOptions?.reportUnusedDisableDirectives)
        .filter((value) => value !== undefined);

      expect(settings).toEqual(["error"]);
    },
  );

  it("promotes a warning and keeps its options", () => {
    const [entry] = withBinarySeverity([
      { rules: { a: "warn", b: 1, c: ["warn", { x: 1 }], d: "off" } },
    ]);

    expect(entry.rules).toEqual({
      a: "error",
      b: "error",
      c: ["error", { x: 1 }],
      d: "off",
    });
  });
});
