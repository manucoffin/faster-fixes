import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it, vi } from "vitest";

import { localRulesPlugin } from "./local-rules/index.js";

// The config reads ESLINT_AGENT_RULES once, at import time, so the gate has to
// be set before the dynamic import below.
process.env.ESLINT_AGENT_RULES = "1";
const { migratedScopeConfigs, nextJsConfig } = await import("./next.js");

/**
 * Resolves the severity `require-use-client-suffix` ends up with for a file
 * under `apps/web`, with `scope` locked and nothing else configured, so the
 * glob assertions read the pattern the way ESLint does.
 */
async function severityResolver(scope) {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: [
      { plugins: { local: localRulesPlugin } },
      ...migratedScopeConfigs(scope, "error"),
    ],
  });

  // A file no config block matches gets no config object at all.
  return async (file) => {
    const config = await eslint.calculateConfigForFile(file);
    return config?.rules?.["local/require-use-client-suffix"]?.[0];
  };
}

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

describe("the migratedScopes lock mechanism", () => {
  it("locks no scope while the array is empty", () => {
    const scopedEntries = nextJsConfig.filter((entry) =>
      entry.files?.some((glob) => glob.startsWith("**/src/app/(")),
    );
    expect(scopedEntries).toEqual([]);

    // The unlocked ramp is still the only home of the services rules.
    expect(entriesFor("local/services-verb-prefix")).toHaveLength(1);
    expect(entriesFor("local/services-verb-prefix")[0].files).toEqual([
      "**/_services/**/*.{ts,tsx}",
    ]);
  });

  it("raises the services rules on the scope's _services/ glob", () => {
    const [servicesBlock] = migratedScopeConfigs("(public)", "error");

    expect(servicesBlock.files).toEqual([
      "**/src/app/(public)/**/_services/**/*.{ts,tsx}",
    ]);
    expect(servicesBlock.rules).toEqual({
      "local/services-verb-prefix": "error",
      "local/services-no-trpc-import": "error",
      "local/require-trpc-output-type": "error",
      "local/services-no-bare-error": "error",
    });
  });

  it("raises the general convention rules on the whole scope", () => {
    const [, scopeBlock] = migratedScopeConfigs(
      "(authenticated)/account",
      "error",
    );

    expect(scopeBlock.files).toEqual([
      "**/src/app/(authenticated)/account/**/*.{ts,tsx}",
    ]);
    expect(scopeBlock.rules).toEqual({
      "local/no-client-import-of-services": "error",
      "local/no-feature-nesting": "error",
      "local/require-schema-conventions": [
        "error",
        { requirePascalCaseSchema: true, requireSingularInput: true },
      ],
      "local/schema-must-be-pure-zod": "error",
      "local/require-use-client-suffix": [
        "error",
        {
          ignorePathPatterns: expect.arrayContaining([
            "/app/.*page\\.tsx$",
            "/app/.*layout\\.tsx$",
          ]),
        },
      ],
    });
  });

  it("stays off outside the agent gate, like every other convention rule", () => {
    const blocks = migratedScopeConfigs("(public)", "off");

    for (const block of blocks) {
      for (const entry of Object.values(block.rules)) {
        const severity = Array.isArray(entry) ? entry[0] : entry;
        expect(severity).toBe("off");
      }
    }
  });

  // Route groups keep their parentheses and dynamic segments their brackets, so
  // the globs are checked against ESLint's own matcher rather than by eye.
  it("matches every file under the named scope and nothing outside it", async () => {
    const severityFor = await severityResolver("admin/users");

    expect(await severityFor("src/app/admin/users/page.tsx")).toBe(2);
    expect(await severityFor("src/app/admin/users/[id]/page.tsx")).toBe(2);
    expect(
      await severityFor("src/app/admin/dashboard/page.tsx"),
    ).toBeUndefined();
  });

  it("matches a route group scope by its parenthesised name", async () => {
    const severityFor = await severityResolver("(public)");

    expect(await severityFor("src/app/(public)/blog/[slug]/page.tsx")).toBe(2);
    expect(await severityFor("src/app/(auth)/login/page.tsx")).toBeUndefined();
  });
});

describe("no-client-import-of-server-errors", () => {
  it("is an error even with the agent gate off", async () => {
    vi.resetModules();
    process.env.ESLINT_AGENT_RULES = "0";
    const { nextJsConfig: ungated } = await import("./next.js");
    process.env.ESLINT_AGENT_RULES = "1";

    const entries = ungated.filter(
      (entry) => entry.rules?.["local/no-client-import-of-server-errors"],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].rules["local/no-client-import-of-server-errors"]).toBe(
      "error",
    );
  });
});
