import { describe, expect, it } from "vitest";

// The config reads ESLINT_AGENT_RULES once, at import time, so the gate has to
// be set before the dynamic import below.
process.env.ESLINT_AGENT_RULES = "1";
const { nextJsConfig } = await import("./next.js");

function entriesFor(ruleName) {
  return nextJsConfig.filter((entry) => entry.rules?.[ruleName] !== undefined);
}

describe("the schema rules wiring", () => {
  it("runs require-schema-conventions on *.schema.ts with both convention options", () => {
    const entries = entriesFor("local/require-schema-conventions");
    expect(entries).toHaveLength(1);

    const [entry] = entries;
    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(entry.rules["local/require-schema-conventions"]).toEqual([
      "warn",
      { requirePascalCaseSchema: true, requireSingularInput: true },
    ]);
  });

  it("runs schema-must-be-pure-zod on *.schema.ts", () => {
    const entries = entriesFor("local/schema-must-be-pure-zod");
    expect(entries).toHaveLength(1);
    expect(entries[0].files).toEqual(["**/*.schema.ts"]);
    expect(entries[0].rules["local/schema-must-be-pure-zod"]).toBe("warn");
  });
});
