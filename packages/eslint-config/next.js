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
    },
  },
  {
    files: ["**/_services/**/*.{ts,tsx}"],
    rules: {
      "local/services-no-bare-error": "error",
      "local/services-verb-prefix": ["error", serviceVerbOptions],
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
