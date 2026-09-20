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

const useClientSuffixOptions = {
  // The Next.js special files need a default export, and a `'use client'`
  // directive under a name the framework fixes, so the suffix cannot apply to
  // them.
  ignorePathPatterns: [
    "/app/.*page\\.tsx$",
    "/app/.*layout\\.tsx$",
    "/app/.*loading\\.tsx$",
    "/app/.*error\\.tsx$",
    "/app/.*not-found\\.tsx$",
  ],
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
      "local/no-default-export": "error",
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
