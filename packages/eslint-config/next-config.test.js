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
const SERVICE_TEST =
  "src/app/_domains/organization/_services/create-organization.test.ts";

// Every `local/` convention rule, each paired with a file its own glob matches,
// so the severity is resolved on a path the rule really guards (ADR-0015).
const CONVENTION_RULES = {
  "local/services-verb-prefix": SERVICE,
  "local/services-no-trpc-import": SERVICE,
  "local/services-read-never-writes": SERVICE,
  "local/require-service-output-type": SERVICE,
  "local/no-client-import-of-services": SERVICE,
  "local/require-use-client-suffix": SERVICE,
  "local/no-default-export": SERVICE,
  "local/no-feature-nesting": FEATURE,
  "local/require-schema-conventions": SCHEMA,
  "local/schema-must-be-pure-zod": SCHEMA,
  "local/no-raw-tailwind-colors": FEATURE,
  "local/no-client-import-of-server-folder": FEATURE,
  "local/no-client-domain-error-instanceof": FEATURE,
  "local/require-inngest-function-placement": SERVICE,
  "local/no-cross-domain-deep-import": SERVICE,
  "local/no-cross-layer-import": SERVICE,
  "local/require-server-action-suffix": SERVICE,
  "local/services-no-bare-error": SERVICE,
  "local/no-relative-test-mock": SERVICE_TEST,
  "local/no-restricted-patterns": FEATURE,
  "local/no-em-dash-in-copy": FEATURE,
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

/** Every message one rule reports for this source text at this path. */
async function messagesFor(file, code, ruleId) {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: nextJsConfig,
  });
  const [result] = await eslint.lintText(code, { filePath: file });

  return result.messages.filter((message) => message.ruleId === ruleId);
}

async function schemaPurityMessagesFor(file, code) {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: nextJsConfig,
  });
  const [result] = await eslint.lintText(code, { filePath: file });

  return result.messages.filter(
    (message) => message.ruleId === "local/schema-must-be-pure-zod",
  );
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

  it("runs schema-must-be-pure-zod on *.schema.ts with its named exceptions", () => {
    const entry = onlyEntryFor("local/schema-must-be-pure-zod");
    const [severity, options] = entry.rules["local/schema-must-be-pure-zod"];

    expect(entry.files).toEqual(["**/*.schema.ts"]);
    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual(["allowImportPatterns"]);
    expect(options.allowImportPatterns).toEqual([
      "/_domains/feedback/_types/feedback-status$",
      "/_domains/project/_helpers/normalize-domain$",
      "^@/app/_domains/subscription$",
    ]);
  });

  // The allowlist is what a schema may reach for, so the two halves are
  // asserted through the real config: a specifier nobody named is reported
  // even though no denylist ever heard of it, and each named exception is the
  // import the tree actually makes.
  it("reports an import the allowlist does not cover", async () => {
    const messages = await schemaPurityMessagesFor(
      SCHEMA,
      `import { format } from "date-fns";\n`,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("must stay pure Zod");
  });

  it("accepts zod, another schema and the generated Prisma enums", async () => {
    for (const specifier of [
      "zod",
      "./line.schema",
      "@workspace/db/generated/prisma/enums",
    ]) {
      const messages = await schemaPurityMessagesFor(
        SCHEMA,
        `import { x } from "${specifier}";\nexport const y = x;\n`,
      );

      expect([specifier, messages]).toEqual([specifier, []]);
    }
  });

  it("accepts each module it names, on the schema that imports it", async () => {
    const namedExceptions = [
      [
        "src/app/api/v1/agent/_services/agent.schema.ts",
        "@/app/_domains/feedback/_types/feedback-status",
      ],
      [
        "src/app/_domains/project/_services/domain.schema.ts",
        "../_helpers/normalize-domain",
      ],
      [
        "src/app/admin/users/_services/create-subscription.schema.ts",
        "@/app/_domains/subscription",
      ],
    ];

    for (const [file, specifier] of namedExceptions) {
      const messages = await schemaPurityMessagesFor(
        file,
        `import { x } from "${specifier}";\nexport const y = x;\n`,
      );

      expect([file, messages]).toEqual([file, []]);
    }
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

  // One pattern rather than a list of loose ones: it names the whole basename
  // of each Next.js special file, so the exemption covers those files and not
  // every module whose name ends in one of their words.
  it("exempts require-use-client-suffix on the Next.js special files, once each", () => {
    const entry = onlyEntryFor("local/require-use-client-suffix");
    const [, options] = entry.rules["local/require-use-client-suffix"];

    expect(options.ignorePathPatterns).toHaveLength(1);

    const [pattern] = options.ignorePathPatterns;

    expect(pattern).toContain("/app/(?:.*/)?");
    for (const name of ["page", "layout", "loading", "error", "not-found"]) {
      expect([name, pattern]).toEqual([name, expect.stringContaining(name)]);
    }
  });

  it("spares the Next.js special files the client suffix and reports their namesakes", async () => {
    const clientComponent = `"use client";\nexport const x = 1;\n`;

    expect(
      await messagesFor(
        "src/app/(authenticated)/projects/page.tsx",
        clientComponent,
        "local/require-use-client-suffix",
      ),
    ).toEqual([]);

    const namesake = await messagesFor(
      "src/app/(authenticated)/projects/_features/edit-page.tsx",
      clientComponent,
      "local/require-use-client-suffix",
    );

    expect(namesake.map((message) => message.severity)).toEqual([2]);
    expect(namesake[0].message).toContain("edit-page.client.tsx");
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

describe("require-service-output-type", () => {
  const RULE = "local/require-service-output-type";
  const CONSUMER =
    "src/app/(authenticated)/(project)/inbox/_features/kanban/kanban-card.client.tsx";

  async function messagesFor(file, code) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(code, { filePath: file });

    return result.messages.filter((message) => message.ruleId === RULE);
  }

  // The consumer half has to reach a consumer, so the rule is wired on the
  // source tree rather than on the services folder it used to be scoped to.
  it("is declared once, for the whole web app source", () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);
    expect(entry.rules[RULE]).toBe("error");
  });

  it("asks a read service for an alias named after its own service", async () => {
    const messages = await messagesFor(
      SERVICE,
      `export async function getActiveSubscription() {\n  return null;\n}\n`,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("GetActiveSubscriptionOutput");
  });

  it("reports router output inference in a client feature file", async () => {
    const messages = await messagesFor(
      CONSUMER,
      `import type { inferRouterOutputs } from "@trpc/server";\nexport type Outputs = inferRouterOutputs<AppRouter>;\n`,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("inferRouterOutputs");
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

describe("services-verb-prefix", () => {
  const RULE = "local/services-verb-prefix";
  const INTEGRATION = "src/app/_domains/integration/_services";

  async function verbMessagesFor(file) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(`export function anything() {}\n`, {
      filePath: file,
    });

    return result.messages.filter((message) => message.ruleId === RULE);
  }

  it("is declared once, with the three vocabulary lists", () => {
    const entry = onlyEntryFor(RULE);
    const [severity, options] = entry.rules[RULE];

    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual([
      "readVerbs",
      "writeVerbs",
      "exemptSuffixes",
    ]);
  });

  // Closed set: a read verb added here would be an ADR change, not a config
  // one, so the list is pinned rather than counted.
  it("passes the closed read set of ADR-0011", () => {
    const [, options] = onlyEntryFor(RULE).rules[RULE];

    expect(options.readVerbs).toEqual([
      "count",
      "find",
      "get",
      "has",
      "is",
      "list",
      "search",
    ]);
  });

  it("passes an open write set that covers the verbs the tree uses", () => {
    const [, options] = onlyEntryFor(RULE).rules[RULE];

    for (const verb of ["create", "update", "delete", "upsert", "handle"]) {
      expect([verb, options.writeVerbs]).toEqual([
        verb,
        expect.arrayContaining([verb]),
      ]);
    }
    expect(options.writeVerbs).not.toContain("edit");
  });

  it("reports a noun-named service and says how to add a verb", async () => {
    const messages = await verbMessagesFor(
      "src/app/_domains/subscription/_services/plan-summary.ts",
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain(
      "add it to `serviceVerbOptions.writeVerbs`",
    );
  });

  it("leaves the integration modules exempt by suffix alone", async () => {
    for (const file of [
      `${INTEGRATION}/github/github-app.ts`,
      `${INTEGRATION}/jira/jira-rest-client.ts`,
      `${INTEGRATION}/jira/jira-errors.ts`,
      `${INTEGRATION}/jira/token-access.ts`,
      `${INTEGRATION}/jira/token-crypto.ts`,
      `${INTEGRATION}/jira/webhook-registration.ts`,
      `${INTEGRATION}/linear/linear-request-error.ts`,
      `${INTEGRATION}/oauth-state-cookie.ts`,
    ]) {
      expect([file, await verbMessagesFor(file)]).toEqual([file, []]);
    }
  });
});

describe("services-read-never-writes", () => {
  const RULE = "local/services-read-never-writes";

  async function writeMessagesFor(file, code) {
    return messagesFor(file, code, RULE);
  }

  it("is declared once, with the read verbs the verb prefix rule reads", () => {
    const entry = onlyEntryFor(RULE);
    const [severity, options] = entry.rules[RULE];
    const [, verbOptions] = onlyEntryFor("local/services-verb-prefix").rules[
      "local/services-verb-prefix"
    ];

    expect(entry.files).toEqual(["**/_services/**/*.{ts,tsx}"]);
    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual(["readVerbs"]);
    expect(options.readVerbs).toBe(verbOptions.readVerbs);
  });

  it("reports a read-verb service that updates a row", async () => {
    const messages = await writeMessagesFor(
      "src/app/_domains/subscription/_services/get-active-subscription.ts",
      `export function getActiveSubscription() {\n  return prisma.subscription.update({});\n}\n`,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain(
      "Rename the service with a write verb",
    );
  });

  it("leaves a write-verb service that writes alone", async () => {
    const messages = await writeMessagesFor(
      "src/app/_domains/subscription/_services/update-subscription.ts",
      `export function updateSubscription() {\n  return prisma.subscription.update({});\n}\n`,
    );

    expect(messages).toEqual([]);
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

  // The lock matches the specifier as written, so the relative spelling of the
  // same escape is listed beside the alias one.
  it("rejects the relative spelling of the same escape", async () => {
    const relativeDeep = await restrictedImportsFor(
      "src/server/trpc/context.ts",
      "../../app/_domains/integration/_services/jira/jira-errors",
    );
    const relativeRouteGroup = await restrictedImportsFor(
      "src/server/trpc/context.ts",
      "../../app/(public)/trpc-router",
    );

    expect(relativeDeep.map((message) => message.severity)).toEqual([2]);
    expect(relativeDeep[0].message).toContain(
      "Import a domain through its barrel",
    );
    expect(relativeRouteGroup).toHaveLength(1);
  });

  it("allows a relative path that stays inside the server folder", async () => {
    expect(
      await restrictedImportsFor(
        "src/server/trpc/context.ts",
        "../auth/config",
      ),
    ).toEqual([]);
    expect(
      await restrictedImportsFor(
        "src/server/trpc/context.ts",
        "../../app/_domains/subscription",
      ),
    ).toEqual([]);
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

describe("no-client-import-of-server-folder", () => {
  const RULE = "local/no-client-import-of-server-folder";

  async function serverFolderMessagesFor(file, specifier) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(
      `"use client";\nimport { x } from "${specifier}";\nexport const y = x;\n`,
      { filePath: file },
    );

    return result.messages.filter((message) => message.ruleId === RULE);
  }

  it("is declared once, at error, with its allowlist named", () => {
    const entry = onlyEntryFor(RULE);
    const [severity, options] = entry.rules[RULE];

    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual(["allowImportPatterns"]);
    // Empty today: the public asset URL builder moved to `src/utils/url/`
    // rather than being exempted.
    expect(options.allowImportPatterns).toEqual([]);
  });

  it("rejects a runtime import of the server folder from a client module", async () => {
    const messages = await serverFolderMessagesFor(
      "src/app/(authenticated)/_features/sidebar/sidebar.client.tsx",
      "@/server/storage/resolve-s3-url",
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("server folder");
  });

  it("leaves a client import of the utils folder alone", async () => {
    expect(
      await serverFolderMessagesFor(
        "src/app/(authenticated)/_features/sidebar/sidebar.client.tsx",
        "@/utils/url/resolve-s3-url",
      ),
    ).toEqual([]);
  });
});

describe("the layer import table", () => {
  const RULE = "local/no-cross-layer-import";

  async function layerMessagesFor(file, code) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(code, { filePath: file });

    return result.messages.filter((message) => message.ruleId === RULE);
  }

  function importing(specifier) {
    return `import { x } from "${specifier}";\nexport const y = x;\n`;
  }

  // One rule with a table, not several blocks of the core restricted-imports
  // rule: flat config would have kept only the last block of those, so a row
  // added later would have deleted the rows before it without a word.
  it("is declared once, for the whole web app source, as one rule carrying every row", () => {
    const entry = onlyEntryFor(RULE);
    const [severity, options] = entry.rules[RULE];

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);
    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual(["rows"]);
    expect(options.rows.map((row) => row.name)).toEqual([
      "a domain barrel exports capabilities, not server implementations",
      "a tRPC router is thin transport, not a query",
      "a helper is pure",
      "a service is transport-agnostic",
      "the root buckets are domain-agnostic",
      "the shared infrastructure folders do not reach into the app tree",
      "`TRPCError` is transport, not domain",
      "database access lives in a services folder or the server folder",
      "the database package has public entry points",
    ]);
  });

  // The core rule stays the server folder lock's alone, pinned by its own
  // test above: every other import-shaped restriction is a row here.
  it("adds no block to the core restricted-imports or restricted-syntax rule", () => {
    expect(entriesFor("no-restricted-imports")).toHaveLength(1);
    expect(entriesFor("no-restricted-syntax")).toHaveLength(0);
  });

  it("names the fix in every row's message", () => {
    const [, options] = onlyEntryFor(RULE).rules[RULE];

    for (const row of options.rows) {
      expect([row.name, row.message.length > 40]).toEqual([row.name, true]);
    }
  });

  describe("a domain barrel exports capabilities, not server implementations", () => {
    const BARREL = "src/app/_domains/billing/index.ts";

    it("rejects a re-exported service", async () => {
      const messages = await layerMessagesFor(
        BARREL,
        `export { getPlan } from "./_services/get-plan";\n`,
      );

      expect(messages.map((message) => message.severity)).toEqual([2]);
      expect(messages[0].message).toContain("barrel");
    });

    it("accepts a type-only re-export of a service's output type", async () => {
      expect(
        await layerMessagesFor(
          BARREL,
          `export type { GetPlanOutput } from "./_services/get-plan";\n`,
        ),
      ).toEqual([]);
    });
  });

  describe("a tRPC router is thin transport, not a query", () => {
    const ROUTER = "src/app/(authenticated)/trpc-router.ts";

    it("rejects a Prisma import", async () => {
      const messages = await layerMessagesFor(
        ROUTER,
        importing("@workspace/db"),
      );

      expect(messages.map((message) => message.severity)).toEqual([2]);
      expect(messages[0].message).toContain("_services/");
    });

    it("accepts a service call", async () => {
      expect(
        await layerMessagesFor(ROUTER, importing("./_services/get-plan")),
      ).toEqual([]);
    });
  });

  describe("`TRPCError` is transport, not domain", () => {
    it("rejects @trpc/server outside a router and the server tRPC folder", async () => {
      const messages = await layerMessagesFor(
        "src/app/_domains/billing/_services/get-plan.ts",
        importing("@trpc/server"),
      );

      expect(messages.map((message) => message.severity)).toEqual([2]);
      expect(messages[0].message).toContain("DomainError");
    });

    it("accepts it in the server tRPC folder, and accepts the fetch adapter anywhere", async () => {
      expect(
        await layerMessagesFor(
          "src/server/trpc/middlewares/enforce-limit.ts",
          importing("@trpc/server"),
        ),
      ).toEqual([]);
      expect(
        await layerMessagesFor(
          "src/app/api/trpc/[trpc]/route.ts",
          importing("@trpc/server/adapters/fetch"),
        ),
      ).toEqual([]);
    });
  });

  describe("database access lives in a services folder or the server folder", () => {
    it("rejects a runtime Prisma import from a feature", async () => {
      const messages = await layerMessagesFor(
        "src/app/(authenticated)/_features/plan-card.tsx",
        importing("@workspace/db"),
      );

      expect(messages.map((message) => message.severity)).toEqual([2]);
      expect(messages[0].message).toContain("`_services/`");
    });

    it("accepts it in a services folder and in the server folder", async () => {
      for (const file of [
        "src/app/_domains/billing/_services/get-plan.ts",
        "src/server/auth/index.ts",
      ]) {
        expect([
          file,
          await layerMessagesFor(file, importing("@workspace/db")),
        ]).toEqual([file, []]);
      }
    });
  });

  describe("the database package has public entry points", () => {
    const SERVICE_FILE = "src/app/_domains/billing/_services/get-plan.ts";

    it("rejects a deep import of the generated Prisma client, type-only included", async () => {
      const messages = await layerMessagesFor(
        SERVICE_FILE,
        `import type { Prisma } from "@workspace/db/generated/prisma/client";\nexport type X = Prisma.UserSelect;\n`,
      );

      expect(messages.map((message) => message.severity)).toEqual([2]);
      expect(messages[0].message).toContain("@workspace/db/types");
    });

    it("accepts the package root, the types entry point and the generated enums", async () => {
      for (const specifier of [
        "@workspace/db",
        "@workspace/db/types",
        "@workspace/db/generated/prisma/enums",
      ]) {
        expect([
          specifier,
          await layerMessagesFor(SERVICE_FILE, importing(specifier)),
        ]).toEqual([specifier, []]);
      }
    });
  });

  describe("a helper is pure", () => {
    const HELPER = "src/app/_domains/billing/_helpers/format-plan.ts";

    it("rejects the database, Next.js and React", async () => {
      for (const specifier of ["@workspace/db", "next/headers", "react"]) {
        const messages = await layerMessagesFor(HELPER, importing(specifier));

        expect([specifier, messages.map((m) => m.severity)]).toEqual([
          specifier,
          [2],
        ]);
        expect(messages[0].message).toContain("pure behavioral");
      }
    });

    it("accepts a sibling helper, a type and a pure package", async () => {
      for (const specifier of [
        "./plan-labels",
        "@/utils/dates/format",
        "zod",
      ]) {
        expect([
          specifier,
          await layerMessagesFor(HELPER, importing(specifier)),
        ]).toEqual([specifier, []]);
      }
    });

    // The published APIs answer with a body their installed clients already
    // parse, so each writes one scope-local mapper (ADR-0012). Building a
    // response is not IO, and the exemption is written file by file.
    it("accepts the named API response mappers", async () => {
      for (const file of [
        "src/app/api/v1/agent/_helpers/agent-error.ts",
        "src/app/api/v1/feedback/_helpers/widget-error-response.ts",
      ]) {
        expect([
          file,
          await layerMessagesFor(file, importing("next/server")),
        ]).toEqual([file, []]);
      }
    });
  });

  describe("a service is transport-agnostic", () => {
    const SERVICE_FILE = "src/app/_domains/billing/_services/get-plan.ts";

    it("rejects the request and response APIs", async () => {
      for (const specifier of [
        "next/server",
        "next/headers",
        "next/navigation",
      ]) {
        const messages = await layerMessagesFor(
          SERVICE_FILE,
          importing(specifier),
        );

        expect([specifier, messages.map((m) => m.severity)]).toEqual([
          specifier,
          [2],
        ]);
        expect(messages[0].message).toContain("transport-agnostic");
      }
    });

    it("accepts a type-only reference and the named agent API guard", async () => {
      expect(
        await layerMessagesFor(
          SERVICE_FILE,
          `import type { NextRequest } from "next/server";\nexport type X = NextRequest;\n`,
        ),
      ).toEqual([]);
      expect(
        await layerMessagesFor(
          "src/app/api/v1/agent/_services/require-agent-auth.ts",
          importing("next/server"),
        ),
      ).toEqual([]);
    });
  });

  describe("the root buckets are domain-agnostic", () => {
    it("rejects a domain import from a root bucket", async () => {
      for (const file of [
        "src/app/_components/seo/software-application-schema.tsx",
        "src/app/_providers/consent-provider.client.tsx",
        "src/app/_constants/seo.ts",
      ]) {
        const messages = await layerMessagesFor(
          file,
          importing("@/app/_domains/subscription"),
        );

        expect([file, messages.map((m) => m.severity)]).toEqual([file, [2]]);
        expect(messages[0].message).toContain("domain-agnostic");
      }
    });

    it("accepts a domain import from a route scope", async () => {
      expect(
        await layerMessagesFor(
          "src/app/(public)/_components/seo/software-application-schema.tsx",
          importing("@/app/_domains/subscription"),
        ),
      ).toEqual([]);
    });
  });

  describe("the shared infrastructure folders do not reach into the app tree", () => {
    it("rejects an app import from lib and from utils", async () => {
      for (const file of [
        "src/lib/mailer/plunk.ts",
        "src/utils/url/get-app-url.ts",
      ]) {
        const messages = await layerMessagesFor(
          file,
          importing("@/app/_domains/user"),
        );

        expect([file, messages.map((m) => m.severity)]).toEqual([file, [2]]);
        expect(messages[0].message).toContain("infrastructure adapters");
      }
    });

    // The relative spelling of the same module, which the shared import helper
    // resolves back to its alias form, so a `../` path is not a way round it.
    it("rejects the relative spelling of the same import", async () => {
      const messages = await layerMessagesFor(
        "src/utils/url/get-app-url.ts",
        importing("../../app/_domains/user"),
      );

      expect(messages.map((m) => m.severity)).toEqual([2]);
    });

    it("accepts a sibling utility and a pure package", async () => {
      for (const specifier of ["../string/slugify", "zod"]) {
        expect([
          specifier,
          await layerMessagesFor(
            "src/utils/url/get-app-url.ts",
            importing(specifier),
          ),
        ]).toEqual([specifier, []]);
      }
    });
  });
});

describe("require-inngest-function-placement", () => {
  const RULE = "local/require-inngest-function-placement";

  it("is declared once, for the whole web app source", () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);
    expect(entry.rules[RULE]).toBe("error");
  });

  it("reports a durable function minted outside an inngest service", async () => {
    const messages = await messagesFor(
      "src/app/api/inngest/route.ts",
      `import { inngest } from "@/server/inngest";\nexport const sync = inngest.createFunction({ id: "sync" }, { event: "a/b" }, async () => {});\n`,
      RULE,
    );

    expect(messages.map((m) => m.severity)).toEqual([2]);
    expect(messages[0].message).toContain("*.inngest.ts");
  });

  it("reports an inngest file outside a services folder", async () => {
    const messages = await messagesFor(
      "src/app/_domains/integration/_helpers/sync-issue.inngest.ts",
      `export const syncIssue = null;\n`,
      RULE,
    );

    expect(messages.map((m) => m.severity)).toEqual([2]);
    expect(messages[0].message).toContain("_services/");
  });

  it("leaves a real inngest service alone", async () => {
    expect(
      await messagesFor(
        "src/app/_domains/integration/_services/jira/create-jira-issue.inngest.ts",
        `import { inngest } from "@/server/inngest";\nexport const createJiraIssue = inngest.createFunction({ id: "create-jira-issue" }, { event: "a/b" }, async () => {});\n`,
        RULE,
      ),
    ).toEqual([]);
  });
});

describe("no-client-domain-error-instanceof", () => {
  const RULE = "local/no-client-domain-error-instanceof";

  it("is declared with the other client boundary rules, for every ts file", () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/*.{ts,tsx}"]);
    expect(entry.rules[RULE]).toBe("error");
  });

  it("reports the test in a client module", async () => {
    const messages = await messagesFor(
      "src/app/(authenticated)/_features/inbox/inbox.client.tsx",
      `export function map(error) {\n  return error instanceof DomainError;\n}\n`,
      RULE,
    );

    expect(messages.map((m) => m.severity)).toEqual([2]);
    expect(messages[0].message).toContain("error.data.code");
  });

  it("leaves the test in a server module alone", async () => {
    expect(
      await messagesFor(
        "src/server/errors/non-retriable.ts",
        `export function map(error) {\n  return error instanceof DomainError;\n}\n`,
        RULE,
      ),
    ).toEqual([]);
  });
});

describe("no-default-export", () => {
  const RULE = "local/no-default-export";

  // Widened from the domains folder: "never use named exports only in a
  // domain" was never the convention, so the glob is the whole source tree.
  it("is declared once, for the whole web app source", () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);
    expect(entry.rules[RULE][0]).toBe("error");
  });

  it("reports a default export outside the domains folder", async () => {
    const messages = await messagesFor(
      "src/app/_components/toolbar.tsx",
      `export default function Toolbar() {}\n`,
      RULE,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("named export");
  });

  it("reports the aliased form too", async () => {
    const messages = await messagesFor(
      "src/app/_components/toolbar.tsx",
      `function Toolbar() {}\nexport { Toolbar as default };\n`,
      RULE,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("mints a default export");
  });

  it("spares the Next.js special files the framework gives a default export", async () => {
    for (const file of [
      "src/app/layout.tsx",
      "src/app/(public)/(home)/page.tsx",
      "src/app/(authenticated)/error.tsx",
      "src/app/not-found.tsx",
      "src/app/sitemap.ts",
      "src/app/robots.ts",
      "src/app/manifest.ts",
      "src/app/opengraph-image.tsx",
    ]) {
      const messages = await messagesFor(
        file,
        `export default function Special() {}\n`,
        RULE,
      );

      expect([file, messages]).toEqual([file, []]);
    }
  });

  it("still reports a module whose name merely ends in a special file name", async () => {
    const messages = await messagesFor(
      "src/app/(authenticated)/projects/_features/edit-page.tsx",
      `export default function EditPage() {}\n`,
      RULE,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
  });
});

describe("require-server-action-suffix", () => {
  const RULE = "local/require-server-action-suffix";

  it("reports a function-level directive in a file without the suffix", async () => {
    const messages = await messagesFor(
      "src/app/(authenticated)/_features/project/project-form.tsx",
      `export async function submit() {\n  "use server";\n  return null;\n}\n`,
      RULE,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("function-level");
  });

  it("allows a function-level directive in a server action file", async () => {
    expect(
      await messagesFor(
        "src/app/(authenticated)/_features/project/rename-project.server.action.ts",
        `export async function renameProject() {\n  "use server";\n  return null;\n}\n`,
        RULE,
      ),
    ).toEqual([]);
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

  async function rawColorWarningsFor(file, source = MOCK_SCREEN) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(source, { filePath: file });

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

  // The shapes a scan anchored on the `className` attribute never reached.
  it("reports a class string held anywhere in the file", async () => {
    const messages = await rawColorWarningsFor(
      "src/app/(authenticated)/_features/status/status-badge.client.tsx",
      [
        `const TONE = { failed: "bg-red-50" };`,
        'const dot = `size-2 ${done ? "bg-emerald-500" : "bg-muted"}`;',
        `const badge = cva("rounded", { variants: { tone: { muted: "text-slate-500" } } });`,
        `export const surface = [TONE, dot, badge];`,
        ``,
      ].join("\n"),
    );

    expect(messages.map((message) => message.message)).toEqual([
      "Avoid raw Tailwind color class `bg-red-50`. Use `bg-destructive` instead.",
      "Avoid raw Tailwind color class `bg-emerald-500`. Use `bg-success` instead.",
      "Avoid raw Tailwind color class `text-slate-500`. Use one of the `muted`, `border` or `foreground` token classes instead.",
    ]);
  });
});

describe("no-relative-test-mock", () => {
  const RULE = "local/no-relative-test-mock";

  it("runs on the test files and nowhere else", async () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/*.test.{ts,tsx}"]);
    expect(entry.rules[RULE]).toBe("error");

    const severityFor = await severityResolver(RULE);

    expect(await severityFor(SERVICE_TEST)).toBe(2);
    expect(await severityFor(SERVICE)).toBeUndefined();
    expect(await severityFor("src/app/api/v1/feedback/route.test.ts")).toBe(2);
  });

  it("reports a mock of a module of the test's own scope", async () => {
    const messages = await messagesFor(
      SERVICE_TEST,
      `import { vi } from "vitest";\nvi.mock("./get-unique-organization-slug", () => ({}));\n`,
      RULE,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("@workspace/db");
    expect(messages[0].message).toContain("@/server/");
    expect(messages[0].message).toContain("@/lib/");
    expect(messages[0].message).toContain("@/app/_domains/<domain>");
  });

  it("accepts a mock at each of the legal boundaries", async () => {
    const boundaries = [
      "@workspace/db",
      "@/server/auth/subscription",
      "@/lib/mailer/client",
      "@better-upload/server/helpers",
      "@/app/_domains/subscription",
    ];

    for (const specifier of boundaries) {
      const messages = await messagesFor(
        SERVICE_TEST,
        `import { vi } from "vitest";\nvi.mock("${specifier}", () => ({}));\n`,
        RULE,
      );

      expect([specifier, messages]).toEqual([specifier, []]);
    }
  });

  // A naming-shaped rule rather than a boundary one: the exception is a
  // comment a reviewer reads in the diff, not an entry in this file.
  it("is disableable with a reason", async () => {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(
      `import { vi } from "vitest";\n// eslint-disable-next-line ${RULE} -- a reviewed one-off\nvi.mock("./sibling", () => ({}));\n`,
      { filePath: SERVICE_TEST },
    );

    expect(result.messages).toEqual([]);
  });
});

// The five style drifts, each held by a plugin or core rule rather than by one
// of ours. The wiring test is what says they are on for the web app source;
// the behaviour cases are the plugin's own, so one rejected and one accepted
// example each is enough to show the rule is live on a real path.
describe("the style rules", () => {
  const STYLE_RULES = [
    "@typescript-eslint/consistent-type-definitions",
    "@typescript-eslint/consistent-type-imports",
    "react/function-component-definition",
    "no-nested-ternary",
    "no-else-return",
  ];

  it("runs every style rule on the web app source and nowhere else", async () => {
    for (const rule of STYLE_RULES) {
      const entry = onlyEntryFor(rule);

      expect([rule, entry.files]).toEqual([rule, ["**/src/**/*.{ts,tsx}"]]);

      const severityFor = await severityResolver(rule);

      expect([rule, await severityFor(FEATURE)]).toEqual([rule, 2]);
      expect([rule, await severityFor(SERVICE)]).toEqual([rule, 2]);
      expect([rule, await severityFor("next.config.ts")]).toEqual([
        rule,
        undefined,
      ]);
    }
  });

  it("reports an `interface` and accepts a `type`", async () => {
    const rule = "@typescript-eslint/consistent-type-definitions";
    const reported = await messagesFor(
      FEATURE,
      `export type Props = { id: string };\ninterface Other { id: string }\n`,
      rule,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(FEATURE, `type Other = { id: string };\n`, rule),
    ).toEqual([]);
  });

  it("reports a value import used only as a type and accepts `import type`", async () => {
    const rule = "@typescript-eslint/consistent-type-imports";
    const reported = await messagesFor(
      FEATURE,
      `import { auth } from "@/server/auth";\nexport type Session = typeof auth;\n`,
      rule,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(
        FEATURE,
        `import type { auth } from "@/server/auth";\nexport type Session = typeof auth;\n`,
        rule,
      ),
    ).toEqual([]);
  });

  it("reports an arrow component and accepts `export function`", async () => {
    const rule = "react/function-component-definition";
    const reported = await messagesFor(
      FEATURE,
      `export const Stars = () => <span />;\n`,
      rule,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(
        FEATURE,
        `export function Stars() {\n  return <span />;\n}\n`,
        rule,
      ),
    ).toEqual([]);
  });

  it("reports a nested ternary and accepts a single one", async () => {
    const rule = "no-nested-ternary";
    const reported = await messagesFor(
      FEATURE,
      `export const label = (a: string) => (a ? "one" : a === "b" ? "two" : "three");\n`,
      rule,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(
        FEATURE,
        `export const label = (a: string) => (a ? "one" : "two");\n`,
        rule,
      ),
    ).toEqual([]);
  });

  it("reports an `else` after a `return` and accepts the flat form", async () => {
    const rule = "no-else-return";
    const reported = await messagesFor(
      SERVICE,
      `export function pick(a: boolean) {\n  if (a) {\n    return 1;\n  } else {\n    return 2;\n  }\n}\n`,
      rule,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(
        SERVICE,
        `export function pick(a: boolean) {\n  if (a) {\n    return 1;\n  }\n\n  return 2;\n}\n`,
        rule,
      ),
    ).toEqual([]);
  });
});

// The three shapes with no plugin rule of their own, held by one rule of ours
// rather than by a second block of the core restricted-syntax rule. The wiring
// test says where it runs and what the one exception is; the behaviour cases
// are here rather than in the rule suite because the double cast exception is
// a config decision, not a rule default.
describe("no-restricted-patterns", () => {
  const RULE = "local/no-restricted-patterns";
  const TEST_FILE =
    "src/app/(authenticated)/integrations/_services/list-agent-tokens.test.ts";

  it("runs on the web app source and nowhere else", async () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);

    const severityFor = await severityResolver(RULE);

    expect(await severityFor(FEATURE)).toBe(2);
    expect(await severityFor(SERVICE)).toBe(2);
    expect(await severityFor("next.config.ts")).toBeUndefined();
  });

  it("carries the test-double exception and nothing else", () => {
    const [severity, options] = onlyEntryFor(RULE).rules[RULE];

    expect(severity).toBe("error");
    expect(Object.keys(options)).toEqual(["allowDoubleCastPathPatterns"]);
    expect(options.allowDoubleCastPathPatterns).toEqual(["\\.test\\.tsx?$"]);
  });

  it("reports an enum and accepts the `as const` object it replaces", async () => {
    const reported = await messagesFor(
      SERVICE,
      `export enum Plan {\n  Free = "free",\n}\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(reported[0].message).toContain("union type");
    expect(
      await messagesFor(
        SERVICE,
        `export const Plan = { Free: "free" } as const;\nexport type Plan = (typeof Plan)[keyof typeof Plan];\n`,
        RULE,
      ),
    ).toEqual([]);
  });

  it("reports a double cast and accepts a single one", async () => {
    const reported = await messagesFor(
      SERVICE,
      `export const id = handle as unknown as number;\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(
      await messagesFor(SERVICE, `export const id = handle as number;\n`, RULE),
    ).toEqual([]);
  });

  it("spares a double cast in a test double and still reports its enum", async () => {
    expect(
      await messagesFor(
        TEST_FILE,
        `const db = { member: {} } as unknown as FakeDb;\n`,
        RULE,
      ),
    ).toEqual([]);

    const reported = await messagesFor(
      TEST_FILE,
      `enum Role {\n  Owner = "owner",\n}\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
  });

  it("reports an empty-array fallback on a query and accepts a count", async () => {
    const reported = await messagesFor(
      FEATURE,
      `export const rows = listQuery.data ?? [];\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(reported[0].message).toContain("matchQueryStatus");
    expect(
      await messagesFor(
        FEATURE,
        `export const count = listQuery.data?.length ?? 0;\n`,
        RULE,
      ),
    ).toEqual([]);
  });

  // The success payload of a guarded query is not the query: the error state
  // already has its own branch, so narrowing it costs nothing.
  it("accepts an empty-array fallback that is not on a query result", async () => {
    expect(
      await messagesFor(
        FEATURE,
        `export const items = grouped[columnId] ?? [];\n`,
        RULE,
      ),
    ).toEqual([]);
  });
});

// The house style's punctuation ban, which ESLint can hold for the source and
// a test holds for the MDX. The cases go through the real config because what
// is asked here is where the rule runs and which text it reads, not how the
// rule walks the tree: its own suite covers that.
describe("no-em-dash-in-copy", () => {
  const RULE = "local/no-em-dash-in-copy";

  // Built from its code point, so that the file asserting the ban is not the
  // file breaking it.
  const DASH = String.fromCodePoint(0x2014);

  it("runs on the web app source and nowhere else", async () => {
    const entry = onlyEntryFor(RULE);

    expect(entry.files).toEqual(["**/src/**/*.{ts,tsx}"]);

    const severityFor = await severityResolver(RULE);

    expect(await severityFor(FEATURE)).toBe(2);
    expect(await severityFor(SERVICE)).toBe(2);
    expect(await severityFor("next.config.ts")).toBeUndefined();
  });

  it("reports a string literal and accepts the comma that replaces it", async () => {
    const reported = await messagesFor(
      FEATURE,
      `export const label = "Free ${DASH} one project.";\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(reported[0].message).toContain("comma, a colon or a period");
    expect(
      await messagesFor(
        FEATURE,
        `export const label = "Free, one project.";\n`,
        RULE,
      ),
    ).toEqual([]);
  });

  it("reports JSX text", async () => {
    const reported = await messagesFor(
      FEATURE,
      `export function Card() {\n  return <p>Free ${DASH} one project.</p>;\n}\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
  });

  it("reports a template chunk", async () => {
    const reported = await messagesFor(
      FEATURE,
      `export const label = (n: number) => \`${"${n}"} projects ${DASH} one seat\`;\n`,
      RULE,
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
  });

  it("accepts an em dash in a comment, which no reader of the site sees", async () => {
    expect(
      await messagesFor(
        SERVICE,
        `// Free ${DASH} the trial tier ${DASH} has no card.\nexport const tier = "free";\n`,
        RULE,
      ),
    ).toEqual([]);
  });
});

// The exception surface: what an agent or a human may switch off in a file,
// and what they may not. Every case goes through `lintText` on the real
// config, because the answer depends on the directive, the rule it names and
// the boundary list together.
describe("the disable comment policy", () => {
  const FILE = "src/app/_domains/subscription/_features/plan-card.tsx";

  async function lintDirective(code) {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(code, { filePath: FILE });

    return result.messages;
  }

  function messagesOf(messages, ruleId) {
    return messages.filter((message) => message.ruleId === ruleId);
  }

  it("names the boundary rules and nothing else", () => {
    const entry = onlyEntryFor("eslint-comments/no-restricted-disable");
    const [severity, ...rules] =
      entry.rules["eslint-comments/no-restricted-disable"];

    expect(severity).toBe("error");
    expect(rules).toEqual([
      "local/no-client-import-of-server-folder",
      "local/no-client-import-of-services",
      "local/no-cross-domain-deep-import",
      "local/no-cross-layer-import",
      "local/require-server-action-suffix",
      "no-restricted-imports",
    ]);
  });

  it("reports a directive with no description", async () => {
    const messages = await lintDirective(
      `// eslint-disable-next-line local/no-default-export\nexport default 1;\n`,
    );
    const reported = messagesOf(
      messages,
      "eslint-comments/require-description",
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(reported[0].message).toContain("descriptions");
  });

  it("accepts a described directive targeting a naming or colour rule", async () => {
    const oneOffs = [
      ["local/no-default-export", `export default function PlanCard() {}\n`],
      [
        "local/no-raw-tailwind-colors",
        `export function Swatch() { return <span className="bg-zinc-800" />; }\n`,
      ],
    ];

    for (const [rule, violation] of oneOffs) {
      const code = `// eslint-disable-next-line ${rule} -- a reviewed one-off\n${violation}`;

      expect([rule, await lintDirective(code)]).toEqual([rule, []]);
    }
  });

  // A boundary is not the guarded module's to lift, so the description makes
  // no difference: the exception belongs in `next.js`, where a reviewer sees
  // it beside the others.
  it("reports a directive targeting a boundary rule, described or not", async () => {
    for (const suffix of ["", " -- the reason does not matter here"]) {
      const messages = await lintDirective(
        `// eslint-disable-next-line local/no-cross-domain-deep-import${suffix}\nimport { x } from "@/app/_domains/project/_services/get-project";\nexport const y = x;\n`,
      );
      const reported = messagesOf(
        messages,
        "eslint-comments/no-restricted-disable",
      );

      expect([suffix, reported.map((message) => message.severity)]).toEqual([
        suffix,
        [2],
      ]);
      expect(reported[0].message).toContain("no-cross-domain-deep-import");
    }
  });

  // The layer import table is a boundary too: a row is lifted by a named
  // allowlist entry in `next.js`, not by the module the row guards.
  it("reports a directive targeting the layer import table", async () => {
    const eslint = new ESLint({
      cwd: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      overrideConfigFile: true,
      overrideConfig: nextJsConfig,
    });
    const [result] = await eslint.lintText(
      `// eslint-disable-next-line local/no-cross-layer-import -- just this once\nimport { prisma } from "@workspace/db";\nexport const y = prisma;\n`,
      { filePath: "src/app/(authenticated)/_features/plan-card.tsx" },
    );
    const reported = result.messages.filter(
      (message) => message.ruleId === "eslint-comments/no-restricted-disable",
    );

    expect(reported.map((message) => message.severity)).toEqual([2]);
    expect(reported[0].message).toContain("no-cross-layer-import");
  });

  // A blanket directive names no rule, so it switches the boundary rules off
  // along with everything else.
  it("reports a blanket directive that names no rule", async () => {
    const messages = await lintDirective(
      `/* eslint-disable -- everything, for a moment */\nexport default 1;\n`,
    );

    expect(
      messagesOf(messages, "eslint-comments/no-restricted-disable"),
    ).toHaveLength(1);
  });

  // Reported as an error rather than the flat-config default warning, so a
  // stale exception fails lint on its own terms.
  it("reports an unused directive", async () => {
    const messages = await lintDirective(
      `// eslint-disable-next-line local/no-default-export -- stale, the default export is gone\nexport const x = 1;\n`,
    );

    expect(messages.map((message) => message.severity)).toEqual([2]);
    expect(messages[0].message).toContain("Unused eslint-disable directive");
  });
});
