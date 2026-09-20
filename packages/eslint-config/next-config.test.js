import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { nextJsConfig } from "./next.js";

const SERVICE =
  "src/app/_domains/subscription/_services/get-active-subscription.ts";
const SCHEMA =
  "src/app/_domains/subscription/_services/upgrade-subscription.schema.ts";
const FEATURE =
  "src/app/(public)/_features/github-stars/github-stars-button.client.tsx";

// Every `local/` convention rule, each paired with a file its own glob matches,
// so the severity is resolved on a path the rule really guards (ADR-0015).
const CONVENTION_RULES = {
  "local/services-verb-prefix": SERVICE,
  "local/services-no-trpc-import": SERVICE,
  "local/require-trpc-output-type": SERVICE,
  "local/no-client-import-of-services": SERVICE,
  "local/require-use-client-suffix": SERVICE,
  "local/no-default-export": SERVICE,
  "local/no-feature-nesting": FEATURE,
  "local/require-schema-conventions": SCHEMA,
  "local/schema-must-be-pure-zod": SCHEMA,
  "local/no-raw-tailwind-colors": FEATURE,
  "local/no-client-import-of-server-errors": FEATURE,
  "local/no-cross-domain-deep-import": SERVICE,
  "local/require-server-action-suffix": SERVICE,
  "local/services-no-bare-error": SERVICE,
};

/**
 * Resolves the severity a rule ends up with for a file under `apps/web`, read
 * through ESLint's own matcher rather than by eye, because route groups keep
 * their parentheses and dynamic segments their brackets.
 */
async function severityResolver(ruleName) {
  // The config declares the `local` plugin itself, so it is passed as-is: a
  // second `plugins` block redefining it is a flat-config error.
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: nextJsConfig,
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

  it("carries no per-file block turning unused disable directives off", () => {
    const suppressions = nextJsConfig.filter(
      (entry) => entry.linterOptions?.reportUnusedDisableDirectives === "off",
    );

    expect(suppressions).toEqual([]);
  });
});

describe("every convention rule is on", () => {
  it("declares each rule exactly once, with no per-scope allowlist", () => {
    for (const rule of Object.keys(CONVENTION_RULES)) {
      expect(onlyEntryFor(rule).rules[rule]).toBeDefined();
    }
  });

  it("exports the config and nothing that could narrow it", async () => {
    const exported = await import("./next.js");

    expect(Object.keys(exported)).toEqual(["nextJsConfig"]);
  });

  it("resolves every rule to error", async () => {
    for (const [rule, file] of Object.entries(CONVENTION_RULES)) {
      const severityFor = await severityResolver(rule);

      expect([rule, await severityFor(file)]).toEqual([rule, 2]);
    }
  });

  // The severity no longer depends on the caller's environment, so the commit
  // hook, CI and an agent all resolve the same rule set (ADR-0015).
  it("reads no environment variable at all", () => {
    const source = readFileSync(new URL("./next.js", import.meta.url), "utf8");

    expect(source).not.toContain("process.env");
  });

  it("applies to every services scope, not a migrated subset", async () => {
    const severityFor = await severityResolver("local/services-verb-prefix");

    expect(
      await severityFor("src/app/api/v1/agent/_services/require-agent-auth.ts"),
    ).toBe(2);
    expect(
      await severityFor("src/app/(public)/_services/get-github-stars.ts"),
    ).toBe(2);
  });

  // Every option the config passes is one a rule reads, and every ignore
  // pattern matches a file that exists: a dead pattern reads as a live
  // exemption to the next person to touch the list.
  it("passes no-raw-tailwind-colors its allowlist and the four illustration exemptions", () => {
    const entry = onlyEntryFor("local/no-raw-tailwind-colors");
    const [severity, options] = entry.rules["local/no-raw-tailwind-colors"];

    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual([
      "allowPatterns",
      "ignorePathPatterns",
    ]);
    expect(options.allowPatterns).toHaveLength(1);
    expect(options.ignorePathPatterns).toHaveLength(4);
  });

  it("exempts require-use-client-suffix on the Next.js special files, once each", () => {
    const entry = onlyEntryFor("local/require-use-client-suffix");
    const [, options] = entry.rules["local/require-use-client-suffix"];

    expect(options.ignorePathPatterns).toEqual([
      "/app/.*page\\.tsx$",
      "/app/.*layout\\.tsx$",
      "/app/.*loading\\.tsx$",
      "/app/.*error\\.tsx$",
      "/app/.*not-found\\.tsx$",
    ]);
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

  it("resolves to error for a service in every scope", async () => {
    const severityFor = await severityResolver("local/services-no-bare-error");

    expect(await severityFor(SERVICE)).toBe(2);
    expect(
      await severityFor("src/app/api/v1/agent/_services/require-agent-auth.ts"),
    ).toBe(2);
  });

  // Every domain-bound file lives in a `_services` bucket, where the rule
  // reaches it. What is left in the server folder is infrastructure, and its
  // bare `throw new Error(` sites stay as they are (ADR 0012).
  it("does not reach the server folder", async () => {
    const severityFor = await severityResolver("local/services-no-bare-error");

    expect(
      await severityFor("src/server/auth/config/email-and-password.tsx"),
    ).toBeUndefined();
    expect(
      await severityFor("src/server/storage/create-asset.ts"),
    ).toBeUndefined();
  });
});

describe("the server folder import lock", () => {
  const DEEP = "@/app/_domains/integration/_services/jira/jira-errors";
  const BARREL = "@/app/_domains/subscription";

  async function restrictedImportsFor(file, specifier) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(
      `import x from "${specifier}";\nexport default x;\n`,
      { filePath: file },
    );

    return result.messages.filter(
      (message) => message.ruleId === "no-restricted-imports",
    );
  }

  it("is declared once, for the server folder, with its exemptions named", () => {
    const entry = onlyEntryFor("no-restricted-imports");

    expect(entry.files).toEqual(["**/src/server/**/*.{ts,tsx}"]);
    expect(entry.ignores).toEqual([
      "**/src/server/trpc/routers/_app.ts",
      "**/src/server/auth/config/database-hooks.ts",
      "**/src/server/trpc/domain-error-mapping.test.ts",
    ]);
    expect(entry.rules["no-restricted-imports"][0]).toBe("error");
  });

  it("rejects a deep import into the app tree", async () => {
    const messages = await restrictedImportsFor(
      "src/server/trpc/context.ts",
      DEEP,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("Import a domain through its barrel");
  });

  it("allows a domain barrel but not a route group deep path", async () => {
    expect(
      await restrictedImportsFor("src/server/trpc/context.ts", BARREL),
    ).toEqual([]);
    expect(
      await restrictedImportsFor(
        "src/server/trpc/context.ts",
        "@/app/(public)/trpc-router",
      ),
    ).toHaveLength(1);
  });

  it("lets the three exempted files reach the app tree by deep path", async () => {
    for (const file of [
      "src/server/trpc/routers/_app.ts",
      "src/server/auth/config/database-hooks.ts",
      "src/server/trpc/domain-error-mapping.test.ts",
    ]) {
      expect([file, await restrictedImportsFor(file, DEEP)]).toEqual([
        file,
        [],
      ]);
    }
  });

  it("leaves the app tree itself alone", async () => {
    expect(
      await restrictedImportsFor(
        "src/app/(authenticated)/trpc-router.ts",
        DEEP,
      ),
    ).toEqual([]);
  });
});

describe("no-client-import-of-server-errors", () => {
  it("is declared once, at error", () => {
    const entry = onlyEntryFor("local/no-client-import-of-server-errors");

    expect(entry.rules["local/no-client-import-of-server-errors"]).toBe(
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
