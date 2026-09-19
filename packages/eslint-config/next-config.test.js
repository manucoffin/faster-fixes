import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it, vi } from "vitest";

// The config reads ESLINT_AGENT_RULES once, at import time, so the gate has to
// be set before the dynamic import below.
process.env.ESLINT_AGENT_RULES = "1";
const { nextJsConfig } = await import("./next.js");

const SERVICE =
  "src/app/_domains/subscription/_services/get-active-subscription.ts";
const SCHEMA =
  "src/app/_domains/subscription/_services/upgrade-subscription.schema.ts";
const FEATURE =
  "src/app/(public)/_features/github-stars/github-stars-button.client.tsx";

// The rules step 3 locked at its final commit, each paired with a file its own
// glob matches, so the severity is resolved on a path the rule really guards.
const STEP_3_RULES = {
  "local/services-verb-prefix": SERVICE,
  "local/services-no-trpc-import": SERVICE,
  "local/require-trpc-output-type": SERVICE,
  "local/no-client-import-of-services": SERVICE,
  "local/require-use-client-suffix": SERVICE,
  "local/no-default-export": SERVICE,
  "local/no-feature-nesting": FEATURE,
  "local/require-schema-conventions": SCHEMA,
  "local/schema-must-be-pure-zod": SCHEMA,
};

/**
 * Resolves the severity a rule ends up with for a file under `apps/web`, read
 * through ESLint's own matcher rather than by eye, because route groups keep
 * their parentheses and dynamic segments their brackets.
 */
async function severityResolver(ruleName, config = nextJsConfig) {
  // The config declares the `local` plugin itself, so it is passed as-is: a
  // second `plugins` block redefining it is a flat-config error.
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: config,
  });

  return async (file) => {
    const resolved = await eslint.calculateConfigForFile(file);
    const entry = resolved?.rules?.[ruleName];
    return Array.isArray(entry) ? entry[0] : entry;
  };
}

function entriesFor(ruleName) {
  return nextJsConfig.filter((entry) => entry.rules?.[ruleName] !== undefined);
}

function onlyEntryFor(ruleName) {
  const entries = entriesFor(ruleName);
  expect(entries).toHaveLength(1);
  return entries[0];
}

describe("the schema rules wiring", () => {
  it("runs require-schema-conventions on *.schema.ts with both convention options", () => {
    const entry = onlyEntryFor("local/require-schema-conventions");

    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(entry.rules["local/require-schema-conventions"]).toEqual([
      "error",
      { requirePascalCaseSchema: true, requireSingularInput: true },
    ]);
  });

  it("runs schema-must-be-pure-zod on *.schema.ts", () => {
    const entry = onlyEntryFor("local/schema-must-be-pure-zod");

    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(entry.rules["local/schema-must-be-pure-zod"]).toBe("error");
  });
});

describe("the step 3 final lock", () => {
  it("declares every step 3 rule exactly once, with no per-scope allowlist", () => {
    for (const rule of Object.keys(STEP_3_RULES)) {
      expect(onlyEntryFor(rule).rules[rule]).toBeDefined();
    }
  });

  it("exports no migratedScopes allowlist or expansion helper", async () => {
    const exported = await import("./next.js");

    expect(Object.keys(exported)).toEqual(["nextJsConfig"]);
  });

  it("resolves every step 3 rule to error inside the agent gate", async () => {
    for (const [rule, file] of Object.entries(STEP_3_RULES)) {
      const severityFor = await severityResolver(rule);

      expect([rule, await severityFor(file)]).toEqual([rule, 2]);
    }
  });

  it("applies the lock outside the migrated scopes of step 3 too", async () => {
    const severityFor = await severityResolver("local/services-verb-prefix");

    expect(
      await severityFor("src/app/api/v1/agent/_services/require-agent-auth.ts"),
    ).toBe(2);
    expect(
      await severityFor("src/app/(public)/_services/get-github-stars.ts"),
    ).toBe(2);
  });

  it("locks no-raw-tailwind-colors at error, the last rule off the ramp", async () => {
    const entry = onlyEntryFor("local/no-raw-tailwind-colors");

    expect(entry.rules["local/no-raw-tailwind-colors"][0]).toBe("error");

    const severityFor = await severityResolver("local/no-raw-tailwind-colors");

    expect(await severityFor(FEATURE)).toBe(2);
  });

  it("stays off outside the agent gate", async () => {
    vi.resetModules();
    process.env.ESLINT_AGENT_RULES = "0";
    const { nextJsConfig: ungated } = await import("./next.js");
    process.env.ESLINT_AGENT_RULES = "1";
    vi.resetModules();

    for (const [rule, file] of Object.entries(STEP_3_RULES)) {
      const severityFor = await severityResolver(rule, ungated);

      expect([rule, await severityFor(file)]).toEqual([rule, 0]);
    }

    const rawColorSeverityFor = await severityResolver(
      "local/no-raw-tailwind-colors",
      ungated,
    );

    expect(await rawColorSeverityFor(FEATURE)).toBe(0);
  });

  // The pre-migration procedure modules all carried a module-level
  // `"use server"`, so the rule was turned off for them. They are gone, and so
  // is the exemption.
  it("no longer exempts the role-suffixed procedure files from the server action suffix", async () => {
    const severityFor = await severityResolver(
      "local/require-server-action-suffix",
    );

    expect(
      await severityFor("src/app/(public)/_services/get-github-stars.ts"),
    ).toBe(2);
    expect(await severityFor("src/app/(public)/x.trpc.mutation.ts")).toBe(2);
  });
});

describe("services-no-bare-error", () => {
  it("is declared once, for the services glob only", () => {
    const entry = onlyEntryFor("local/services-no-bare-error");

    expect(entry.files).toEqual(["**/_services/**/*.{ts,tsx}"]);
    expect(entry.rules["local/services-no-bare-error"]).toBe("error");
  });

  it("resolves to error for a service with the agent gate off", async () => {
    vi.resetModules();
    process.env.ESLINT_AGENT_RULES = "0";
    const { nextJsConfig: ungated } = await import("./next.js");
    process.env.ESLINT_AGENT_RULES = "1";
    vi.resetModules();

    const severityFor = await severityResolver(
      "local/services-no-bare-error",
      ungated,
    );

    expect(await severityFor(SERVICE)).toBe(2);
    expect(
      await severityFor("src/app/api/v1/agent/_services/require-agent-auth.ts"),
    ).toBe(2);
  });

  // `src/server/**` keeps its 28 infrastructure `throw new Error(` sites until
  // step 5 relocates those files into a domain.
  it("does not reach the server folder", async () => {
    const severityFor = await severityResolver("local/services-no-bare-error");

    expect(
      await severityFor("src/server/auth/email-and-password.tsx"),
    ).toBeUndefined();
    expect(await severityFor("src/server/jira/client.ts")).toBeUndefined();
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

describe("no-raw-tailwind-colors", () => {
  const ILLUSTRATION_FILES = [
    "src/app/(public)/(home)/_features/hero/hero-flow-animation.client.tsx",
    "src/app/(public)/(home)/_features/how-it-works/flow-animations.tsx",
    "src/app/(public)/(home)/_features/before-after-section.tsx",
    "src/app/(public)/(home)/_features/problem/problem-chat-animation.client.tsx",
  ];

  // Two classes the hue-to-token table reports, so an empty result proves the
  // path was ignored rather than the hues being unreported.
  const MOCK_SCREEN = `const Mock = () => <span className="bg-zinc-800 text-red-500" />;\n`;

  async function rawColorWarningsFor(file) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(MOCK_SCREEN, { filePath: file });

    return result.messages.filter(
      (message) => message.ruleId === "local/no-raw-tailwind-colors",
    );
  }

  it("ignores the four home page illustration files", async () => {
    for (const file of ILLUSTRATION_FILES) {
      expect([file, await rawColorWarningsFor(file)]).toEqual([file, []]);
    }
  });

  it("still reports a neighbour of the illustration files", async () => {
    const messages = await rawColorWarningsFor(
      "src/app/(public)/(home)/_features/hero/hero-title.tsx",
    );

    expect(messages.map((message) => message.message)).toEqual([
      "Avoid raw Tailwind color class `bg-zinc-800`. Use one of the `muted`, `border` or `foreground` token classes instead.",
      "Avoid raw Tailwind color class `text-red-500`. Use `text-destructive` instead.",
    ]);
    expect(messages.map((message) => message.severity)).toEqual([2, 2]);
  });
});
