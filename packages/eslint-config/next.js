import pluginEslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";
import { localRulesPlugin } from "./local-rules/index.js";

// Both options are the repo convention, not opt-in extras: a schema const is
// PascalCase (`CreateInvoiceSchema`) and its input type is singular
// (`CreateInvoiceInput`). Wiring them is what makes a plural `Inputs` alias
// report instead of silently passing.
const schemaConventionOptions = {
  requirePascalCaseSchema: true,
  requireSingularInput: true,
};

// The specifiers a schema may import besides Zod, another `*.schema` file and
// the generated Prisma enums. The rule is an allowlist, so this list is the
// whole of the exception surface: a new server-only import in a schema is
// rejected until somebody adds it here and a reviewer reads the reason.
//
// Each entry is a module that is pure by construction, reviewed like the
// server folder deep-import exemptions below.
const schemaPurityOptions = {
  allowImportPatterns: [
    // Glossary vocabulary, not an operation input: a Zod enum for a CONTEXT.md
    // value lives in `_types/` rather than in a schema file, so the schema that
    // validates that value has to reach for it there. The module is Zod and
    // string literals.
    "/_domains/feedback/_types/feedback-status$",
    // A pure string helper: the domain schema normalises a host name inside a
    // `transform`, and the helper has no import of its own.
    "/_domains/project/_helpers/normalize-domain$",
    // The plan and status vocabulary of the subscription domain, read through
    // that domain's barrel, which is the only sanctioned cross-domain
    // specifier. The values are enums; the barrel's other exports are client
    // safe.
    "^@/app/_domains/subscription$",
  ],
};

// The Next.js special files, whose name and shape the framework owns: each one
// is reached by its path and read through its default export. Two rules read
// the list, so it is written once: the default export rule cannot ask them for
// a named export, and the client suffix rule cannot ask one that carries a
// `'use client'` directive for a `.client.tsx` name.
//
// `route.ts`, `proxy.ts`, `instrumentation.ts` and `mdx-components.tsx` are not
// here: the framework reads named exports from them, so they meet both
// conventions as they are.
const nextSpecialFilenames = [
  "apple-icon",
  "default",
  "error",
  "forbidden",
  "global-error",
  "icon",
  "layout",
  "loading",
  "manifest",
  "not-found",
  "opengraph-image",
  "page",
  "robots",
  "sitemap",
  "template",
  "twitter-image",
  "unauthorized",
];

// Anchored on the whole basename, under the app folder: a feature file whose
// name merely ends in one of those words (`edit-page.tsx`, `form-error.tsx`) is
// an ordinary module and is not spared.
const nextSpecialFilePattern = `/app/(?:.*/)?(?:${nextSpecialFilenames.join(
  "|",
)})\\.tsx?$`;

const useClientSuffixOptions = {
  ignorePathPatterns: [nextSpecialFilePattern],
};

const noDefaultExportOptions = {
  ignorePathPatterns: [nextSpecialFilePattern],
};

// The service naming vocabulary, in one place because two rules read it: the
// verb prefix rule below, and the read-never-writes rule that holds a read verb
// to its promise.
//
// The read verbs are a closed set (ADR-0011): "a verb outside this list means a
// possible write" is the signal the whole convention rests on, so extending it
// is not a config change, it is an ADR change. The write verbs are open, which
// is exactly why they are listed here: coining a domain verb for a distinct
// domain transition is a one-line, reviewed addition, and the rule's report
// says so. The list is the vocabulary the tree uses today.
//
// The exempt suffixes name the `_services/` modules that are not operations (an
// SDK client factory, an error class, a token cipher, a cookie reader, the
// GitHub App factory). Naming one `get-…` would lie about what it is.
const serviceVerbOptions = {
  readVerbs: ["count", "find", "get", "has", "is", "list", "search"],
  writeVerbs: [
    "accept",
    "add",
    "complete",
    "create",
    "delete",
    "disconnect",
    "handle",
    "impersonate",
    "leave",
    "link",
    "notify",
    "refresh",
    "regenerate",
    "register",
    "reject",
    "request",
    "require",
    "reset",
    "restore",
    "revoke",
    "select",
    "send",
    "sign",
    "stop",
    "sync",
    "toggle",
    "unlink",
    "update",
    "upgrade",
    "upsert",
  ],
  exemptSuffixes: [
    "access",
    "app",
    "client",
    "cookie",
    "crypto",
    "error",
    "errors",
    "registration",
  ],
};

// The sanctioned exceptions to the client/server boundary: a client module may
// import a runtime value from these server folder modules and no others. Empty
// on purpose. A module of the server folder that a client may call is a module
// that does not belong there (the folder admits wiring and server-only
// cross-cutting abstractions only), so the first answer is to move the value
// to `src/utils/` or `src/lib/`, as the public asset URL builder was. An entry
// here is reviewed like the server folder deep-import exemptions below.
const clientServerImportOptions = {
  allowImportPatterns: [],
};

// The one exception to the double-cast ban: a service test builds a partial
// fake of the Prisma client and passes it through the dependency-injection
// seam, whose parameter type is the real client. A partial object cannot reach
// that type without the widening step, and giving the double a hand-written
// type would mean writing out a surface the test does not use. The other two
// patterns of the rule still apply to a test file.
const restrictedPatternOptions = {
  allowDoubleCastPathPatterns: ["\\.test\\.tsx?$"],
};

const rawTailwindColorOptions = {
  // Allow explicit palette classes for charting or third-party styling edge-cases.
  allowPatterns: [
    "^fill-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}$",
  ],
  // The home page illustrations only: drawn mock screens keep fixed colours on
  // purpose, independently of the theme.
  ignorePathPatterns: [
    "/\\(home\\)/_features/hero/hero-flow-animation\\.client\\.tsx$",
    "/\\(home\\)/_features/how-it-works/flow-animations\\.tsx$",
    "/\\(home\\)/_features/before-after-section\\.tsx$",
    "/\\(home\\)/_features/problem/problem-chat-animation\\.client\\.tsx$",
  ],
};

// The layer import table, read by `local/no-cross-layer-import` as its rule
// options. One rule with a table rather than several blocks of the core
// restricted-imports rule: flat config replaces rather than merges two blocks
// of the same core rule matching one file, so the second restriction written
// that way would silently delete the first.
//
// A row is a source path pattern, the specifiers that source may not import,
// the message an agent gets, and an allowlist of sanctioned specifiers. Rows
// are read in order and the first match reports, so the narrow rows come
// first and own the message. `runtimeOnly` marks the rows that are about what
// reaches a runtime: a type import is erased, so it does not cross those
// boundaries.
//
// Every pattern is a regular expression over the posix path or the specifier,
// which is how the other rules of this package match paths.
//
// The rows fall into two halves. The first six scope themselves to one bucket
// and say what that bucket is for: a barrel publishes capabilities, a router is
// transport, a helper is pure, a service is transport-agnostic, the root
// buckets are domain-agnostic, and the infrastructure folders are imported by
// the app tree rather than importing it. The last three watch the whole source
// tree for a specifier that belongs to one layer only. The bucket rows come
// first so that a file inside a bucket gets the message written for it.
const layerImportRows = [
  {
    name: "a domain barrel exports capabilities, not server implementations",
    sourcePathPattern: "/src/app/_domains/[^/]+/index\\.ts$",
    forbiddenPatterns: ["/_services/", "(^|/)trpc-router$"],
    // A type-only re-export from `_services/` is the sanctioned way to publish
    // a service's output type, so this row judges runtime edges only.
    runtimeOnly: true,
    message:
      "A domain barrel exposes UI, schemas, types and pure helpers (ADR-0010). A service is called by its own domain's server side through its deep path, a router is mounted on the root router, and a service's output type is published as a type-only re-export.",
  },
  {
    name: "a tRPC router is thin transport, not a query",
    sourcePathPattern: "(^|/)trpc-router\\.ts$",
    forbiddenPatterns: ["^@workspace/db(/|$)", "^@prisma/client(/|$)"],
    message:
      "A tRPC router validates input and calls a service (ADR-0011). Move the Prisma query into a `_services/` module of the same scope and call it from the procedure.",
  },
  {
    name: "a helper is pure",
    sourcePathPattern: "(^|/)_helpers/",
    // The five modules that build a response or a request rather than doing
    // IO. `_helpers/` purity is about IO, and `NextResponse.json(…)` is a value
    // constructor, so each of these is a pure function that happens to name a
    // framework type. Named file by file so the exception cannot grow into a
    // pattern.
    //
    // The three mappers are the scope-local error responses of the published
    // APIs: the widget and agent contracts are bodies that installed clients
    // already parse, so they are written once per scope rather than per route
    // (ADR-0012). The two test-double modules build a `NextRequest` fixture and
    // nothing under `src/` imports them at runtime.
    exemptPathPatterns: [
      "/src/app/api/v1/agent/_helpers/agent-error\\.ts$",
      "/src/app/api/v1/agent/_helpers/is-auth-failure\\.ts$",
      "/src/app/api/v1/agent/_helpers/agent-api-test-doubles\\.ts$",
      "/src/app/api/v1/feedback/_helpers/widget-error-response\\.ts$",
      "/src/app/api/v1/feedback/_helpers/widget-api-test-doubles\\.ts$",
    ],
    forbiddenPatterns: [
      "^@workspace/db(/|$)",
      "^@prisma/client(/|$)",
      "^next(/|$)",
      "^react(-dom)?(/|$)",
    ],
    message:
      "`_helpers/` holds pure behavioral functions: no IO, no JSX, no React state (ADR-0011). A function that queries the database or reads the request is a service and belongs in `_services/`; UI belongs in `_components/` or a feature.",
  },
  {
    name: "a service is transport-agnostic",
    // `require-agent-auth.ts` is the one sanctioned exception, recorded in the
    // backend standard: it returns `AuthenticatedAgentToken | NextResponse`
    // because its 401, 403 and 429 carry headers and body fields no
    // `DomainError` can express, and it does IO, so it is a transport guard by
    // design. It is not a precedent: no other service may return a `Response`.
    sourcePathPattern: "(^|/)_services/",
    exemptPathPatterns: [
      "/src/app/api/v1/agent/_services/require-agent-auth\\.ts$",
    ],
    forbiddenPatterns: ["^next/(server|headers|navigation)$"],
    // A service typed against `NextRequest` still takes plain named values at
    // runtime; it is the call into the request that binds it to a transport.
    runtimeOnly: true,
    message:
      "A service is transport-agnostic: it takes plain named values and never reaches for the request or the response itself (ADR-0011). Let the route or the procedure read `next/headers` and pass what the service needs by name, and throw a `DomainError` rather than returning a response.",
  },
  {
    name: "the root buckets are domain-agnostic",
    sourcePathPattern: "/src/app/_(components|providers|constants)/",
    forbiddenPatterns: ["^@/app/_domains(/|$)"],
    message:
      "Root `_components/`, `_providers/` and `_constants/` are domain-agnostic and slated for extraction into shared packages (ADR-0010), so they carry no domain knowledge. Move this module into the domain it reads, or into the route scope that uses it.",
  },
  {
    name: "the shared infrastructure folders do not reach into the app tree",
    sourcePathPattern: "/src/(lib|utils)/",
    forbiddenPatterns: ["^@/app(/|$)"],
    message:
      "`src/lib/` and `src/utils/` are infrastructure adapters and pure utilities that the app tree imports, never the other way round (ADR-0011). Move the app-specific part into the scope that needs it, or pass it in as a parameter.",
  },
  {
    name: "`TRPCError` is transport, not domain",
    sourcePathPattern: "/src/",
    exemptPathPatterns: ["/src/server/trpc/", "(^|/)trpc-router\\.ts$"],
    forbiddenPatterns: ["^@trpc/server$"],
    message:
      "`TRPCError` belongs to the transport layer: a router or `src/server/trpc/` (ADR-0012). A service throws a `DomainError` subclass and the tRPC error mapper turns it into a `TRPCError`; a client branches on `error.data.code`.",
  },
  {
    name: "database access lives in a services folder or the server folder",
    sourcePathPattern: "/src/",
    exemptPathPatterns: ["/_services/", "/src/server/"],
    forbiddenPatterns: ["^@workspace/db(/|$)", "^@prisma/client(/|$)"],
    // A row about the runtime edge: a Prisma row type names no connection.
    runtimeOnly: true,
    message:
      "Database access lives in a `_services/` module or in `src/server/` (ADR-0011). Call a service from here rather than importing the Prisma client.",
  },
  {
    name: "the database package has public entry points",
    sourcePathPattern: "/src/",
    // Anything inside the package that is not one of its entry points: the
    // package declares no `exports` map, so this row is what closes the leak
    // ADR-0013 records. `@workspace/db` is the client instance,
    // `@workspace/db/types` the Prisma row and input types, and
    // `generated/prisma/enums` the generated enum vocabulary a schema may
    // import, which the schema purity rule names too.
    forbiddenPatterns: ["^@workspace/db/(?!types$|generated/prisma/enums$)"],
    message:
      "The database package is imported through its public entry points (ADR-0013): `@workspace/db` for the client instance, `@workspace/db/types` for Prisma row and input types, `@workspace/db/generated/prisma/enums` for the generated enums. Everything else inside the package is private to it.",
  },
];

// The server folder holds wiring and cross-cutting abstractions only, so it
// never reaches into the app tree by deep path. A domain is imported through
// its barrel; everything else below is a reviewed exception, named file by
// file so it cannot grow into a pattern.
const serverDeepImportExemptions = [
  // Composition: the root router mounts the domain and route-group routers,
  // which a barrel never exports.
  "**/src/server/trpc/routers/_app.ts",
  // Composition: the Better Auth database hooks call the Organization slug
  // service on sign-up.
  "**/src/server/auth/config/database-hooks.ts",
  // Fixture, not production coupling: the mapping test names a real
  // second-level domain error so the assertion holds for a shipped subclass.
  "**/src/server/trpc/domain-error-mapping.test.ts",
];

const serverDeepImportMessage =
  "The server folder holds wiring and cross-cutting abstractions only. Import a domain through its barrel (`@/app/_domains/<domain>`) rather than reaching into the app tree.";

// Two groups rather than one: these globs follow gitignore semantics, where a
// negation cannot re-include a path whose parent the group already excluded.
// So the domains are carved out of the first group and their insides are
// forbidden by the second.
//
// Each group carries the relative spelling of its own alias patterns: the core
// rule matches the specifier string, so `../../app/_domains/<d>/<file>` would
// otherwise walk out of the server folder past a lock written for `@/app/…`.
const serverDeepImportPatterns = [
  {
    group: [
      "@/app/*/**",
      "!@/app/_domains/**",
      "../**/app/*/**",
      "!../**/app/_domains/**",
    ],
    message: serverDeepImportMessage,
  },
  {
    // `@/app/_domains/<domain>` is the barrel and stays allowed; anything below
    // it does not.
    group: ["@/app/_domains/*/**", "../**/app/_domains/*/**"],
    message: serverDeepImportMessage,
  },
];

// The rules a file may not switch off from the inside (ADR-0015): the
// client/server import rules, the cross-domain import rule, the server folder
// lock and the server action suffix rule. Each one draws a boundary between
// layers, so the module on one side of it is the last place that should get to
// decide the boundary does not apply. An exception to one of them is a named
// entry in this file, reviewed like the server folder deep-import exemptions
// above; the rule's report is not the place to argue for it.
//
// A naming, schema or colour rule is absent on purpose: a genuine one-off there
// is a disable comment with a reason, which a reviewer reads in the diff.
//
// A blanket `/* eslint-disable */` is reported by this rule too, whatever it
// names: it disables every rule, boundary rules included.
const notDisableableRules = [
  "local/no-client-import-of-server-folder",
  "local/no-client-import-of-services",
  "local/no-cross-domain-deep-import",
  "local/no-cross-layer-import",
  "local/require-server-action-suffix",
  "no-restricted-imports",
];

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
  // Next.js and Fumadocs write these; they are build output, not source.
  {
    ignores: [".next/**", ".source/**", "next-env.d.ts"],
  },
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
      local: localRulesPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // Every rule below is `error` with no environment gate and no per-scope
  // allowlist (ADR-0015): one lint mode, so lint-staged, CI and an agent
  // enforce the same set. A rule reporting anything here is a regression.
  {
    rules: {
      // Only Error instances carry a stack, so only they may be thrown.
      "no-throw-literal": "error",
    },
  },
  // The exception surface of the whole rule set: a rule may be switched off in
  // a file, in writing, unless it guards a boundary. A stale exception is a
  // report of its own, so an exception that outlives its reason is deleted
  // rather than inherited.
  {
    linterOptions: {
      // `error` rather than the flat-config default of `warn`: an unused
      // directive fails lint on its own terms, not only because the web app
      // happens to lint with `--max-warnings 0`.
      reportUnusedDisableDirectives: "error",
    },
    plugins: {
      "eslint-comments": pluginEslintComments,
    },
    rules: {
      "eslint-comments/require-description": "error",
      "eslint-comments/no-restricted-disable": [
        "error",
        ...notDisableableRules,
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "local/require-server-action-suffix": "error",
      // A client file importing a runtime value from `src/server/` leaks
      // server-only code into the bundle, and for the errors bucket it is a
      // correctness problem too: `instanceof` does not survive serialization
      // (ADR-0012).
      "local/no-client-import-of-server-folder": [
        "error",
        clientServerImportOptions,
      ],
      "local/no-client-import-of-services": "error",
      // The serialization half of the same boundary: an import rule cannot see
      // a `DomainError` a client reaches by any other route, and the test is
      // always false either way (ADR-0012).
      "local/no-client-domain-error-instanceof": "error",
    },
  },
  {
    files: ["**/_services/**/*.{ts,tsx}"],
    rules: {
      "local/services-no-bare-error": "error",
      "local/services-verb-prefix": ["error", serviceVerbOptions],
      // The other half of the verb convention: the prefix rule checks that the
      // name carries a read verb, this one checks that the name is true. It
      // reads the same closed list, passed from the same place.
      "local/services-read-never-writes": [
        "error",
        { readVerbs: serviceVerbOptions.readVerbs },
      ],
      "local/services-no-trpc-import": "error",
    },
  },
  {
    files: ["**/src/app/_domains/**/*.{ts,tsx}"],
    rules: {
      "local/no-cross-domain-deep-import": "error",
    },
  },
  {
    files: ["**/_features/**/*.{ts,tsx}"],
    rules: {
      "local/no-feature-nesting": "error",
    },
  },
  {
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      "local/require-use-client-suffix": ["error", useClientSuffixOptions],
      // The whole source tree, not the domains folder it used to be scoped to:
      // "never use default exports" is a repo-wide convention, so a component
      // outside a domain is held to it too.
      "local/no-default-export": ["error", noDefaultExportOptions],
      // The layer import table (ADR-0010, ADR-0011, ADR-0012, ADR-0013): one
      // rule over the whole source tree, whose rows scope themselves to the
      // folder each boundary belongs to.
      "local/no-cross-layer-import": ["error", { rows: layerImportRows }],
      // Both halves of the output type convention (ADR-0011), so the glob is
      // the whole source tree and not the services folder: the producer half
      // scopes itself to a read service, the consumer half forbids inferring
      // the same type from the router wherever a consumer lives.
      "local/require-service-output-type": "error",
      // Not import-shaped, so not a row of the table above: one half looks at
      // a call expression and the other at a filename. The whole source tree,
      // because both halves are about a file being in the wrong place.
      "local/require-inngest-function-placement": "error",
    },
  },
  {
    // The five style drifts an agent reproduces most, each held by a rule the
    // repo already installs rather than by a rule of ours: the plugins say it
    // better, and a rule we do not maintain is a rule that cannot rot.
    //
    // The glob is the web app source, the same one the repo-wide conventions
    // above use, so a config or script file at the app root is not held to a
    // component convention.
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      // `type` over `interface`: one way to name an object shape, and the one
      // that composes with unions and intersections.
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // An import used only as a type says so. Without it, a module that
      // imports server code for `typeof` alone reads as a runtime dependency,
      // and the client boundary rules cannot tell it from a real one.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" },
      ],
      // A named component is an `export function`, which hoists and shows its
      // name in a stack. An unnamed one is still an arrow, because that is the
      // only thing an inline render prop can be.
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      // A ternary inside a ternary is a branch a reader has to unpick; an early
      // return or a lookup says the same thing in reading order.
      "no-nested-ternary": "error",
      // An `else` after a `return` is a block that could be the rest of the
      // function.
      "no-else-return": "error",
    },
  },
  {
    // The three shapes with no plugin rule to lean on, in one rule of ours: a
    // TypeScript `enum`, an `as unknown as` double cast and an empty-array
    // fallback on a query result. Same glob as the style rules above, for the
    // same reason: they are conventions of the app source, not of a config
    // file at the app root.
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      "local/no-restricted-patterns": ["error", restrictedPatternOptions],
    },
  },
  {
    // The one non-negotiable of the house style that a linter can hold: no em
    // dash in user-facing text. Same glob as the style rules above, because a
    // config file at the app root ships no copy, and only the three node kinds
    // that can carry copy are read, so a comment keeps its dashes.
    //
    // MDX is the other half of the convention and ESLint cannot parse it:
    // `apps/web/src/mdx-no-em-dash.test.ts` reads those files directly.
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      "local/no-em-dash-in-copy": "error",
    },
  },
  {
    // Test files only: the rule reads a `vi.mock()` call, which exists nowhere
    // else, and the boundary it names is a boundary for a test rather than for
    // production code.
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "local/no-relative-test-mock": "error",
    },
  },
  {
    files: ["**/*.schema.ts"],
    rules: {
      "local/require-schema-conventions": ["error", schemaConventionOptions],
      "local/schema-must-be-pure-zod": ["error", schemaPurityOptions],
    },
  },
  {
    // Class strings show up in every file type the app lints, so this one is
    // not scoped to a glob.
    rules: {
      "local/no-raw-tailwind-colors": ["error", rawTailwindColorOptions],
    },
  },
  {
    // The server folder rule of the architecture document, enforced: a deep
    // import from here into the app tree fails lint, and so the pre-commit
    // hook.
    files: ["**/src/server/**/*.{ts,tsx}"],
    ignores: serverDeepImportExemptions,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: serverDeepImportPatterns },
      ],
    },
  },
];
