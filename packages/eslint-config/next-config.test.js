import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it, vi } from "vitest";

import { localRulesPlugin } from "./local-rules/index.js";

// The config reads ESLINT_AGENT_RULES once, at import time, so the gate has to
// be set before the dynamic import below.
process.env.ESLINT_AGENT_RULES = "1";
const {
  migratedScopeConfigs,
  migratedScopeEntry,
  migratedScopes,
  nextJsConfig,
} = await import("./next.js");

/**
 * Resolves the severity `require-use-client-suffix` ends up with for a file
 * under `apps/web`, with `scope` locked and nothing else configured, so the
 * glob assertions read the pattern the way ESLint does.
 */
async function severityResolver(scope, ignores = []) {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: [
      { plugins: { local: localRulesPlugin } },
      ...migratedScopeConfigs(scope, "error", ignores),
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

// A locked scope re-declares the schema rules on its own glob, so the burn-down
// ramp is the first entry and every later one belongs to a scope in
// `migratedScopes`.
function rampEntryFor(ruleName) {
  const [ramp, ...locked] = entriesFor(ruleName);
  expect(locked).toHaveLength(migratedScopes.length);
  return ramp;
}

describe("the schema rules wiring", () => {
  it("runs require-schema-conventions on *.schema.ts with both convention options", () => {
    const entry = rampEntryFor("local/require-schema-conventions");

    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(entry.rules["local/require-schema-conventions"]).toEqual([
      "warn",
      { requirePascalCaseSchema: true, requireSingularInput: true },
    ]);
  });

  it("runs schema-must-be-pure-zod on *.schema.ts", () => {
    const entry = rampEntryFor("local/schema-must-be-pure-zod");

    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(entry.rules["local/schema-must-be-pure-zod"]).toBe("warn");
  });
});

describe("the migratedScopes lock mechanism", () => {
  it("locks exactly the scopes listed in migratedScopes, after the ramp", () => {
    const [ramp, ...locked] = entriesFor("local/services-verb-prefix");

    // The unlocked ramp still covers every `_services/` folder at `warn`.
    expect(ramp.files).toEqual(["**/_services/**/*.{ts,tsx}"]);
    expect(locked.map((entry) => entry.files)).toEqual(
      migratedScopes.map((entry) => [
        `**/src/app/${migratedScopeEntry(entry).scope}/**/_services/**/*.{ts,tsx}`,
      ]),
    );

    // A locked scope also raises the general convention rules on all its files.
    const [, ...scopeBlocks] = entriesFor("local/no-client-import-of-services");
    expect(scopeBlocks.map((entry) => entry.files)).toEqual(
      migratedScopes.map((entry) => [
        `**/src/app/${migratedScopeEntry(entry).scope}/**/*.{ts,tsx}`,
      ]),
    );

    // The locks are appended last, so they win over the ramp.
    const lastBlocks = nextJsConfig.slice(-2 * migratedScopes.length);
    expect(lastBlocks).toEqual(
      migratedScopes.flatMap((entry) => {
        const { scope, ignores } = migratedScopeEntry(entry);

        return migratedScopeConfigs(scope, "error", ignores);
      }),
    );
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

  // A route group whose own tier is migrated locks its shell and leaves its
  // nested scopes on the burn-down until their own ticket lists them.
  it("leaves the nested scopes of a partially migrated group unlocked", async () => {
    const severityFor = await severityResolver("(authenticated)", [
      "**/src/app/(authenticated)/account/**",
    ]);

    expect(await severityFor("src/app/(authenticated)/layout.tsx")).toBe(2);
    expect(
      await severityFor(
        "src/app/(authenticated)/_features/feedback/x.client.tsx",
      ),
    ).toBe(2);
    expect(
      await severityFor("src/app/(authenticated)/account/settings/page.tsx"),
    ).toBeUndefined();
  });

  it("omits the ignores key for a scope with no nested exclusion", () => {
    for (const block of migratedScopeConfigs("(public)", "error")) {
      expect(block.ignores).toBeUndefined();
    }
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
