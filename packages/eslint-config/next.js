import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";
import { localRulesPlugin } from "./local-rules/index.js";

const enableAgentRules = process.env.ESLINT_AGENT_RULES === "1";

// Every convention rule reports at `error` with nothing to report, so any
// report is a regression. They stay behind the agent gate on purpose: taking a
// rule out of the gate is the same as adding it to the commit hook.
const migratedSeverity = enableAgentRules ? "error" : "off";

// Both options are the repo convention, not opt-in extras: a schema const is
// PascalCase (`CreateInvoiceSchema`) and its input type is singular
// (`CreateInvoiceInput`). Wiring them is what makes a plural `Inputs` alias
// report instead of silently passing.
const schemaConventionOptions = {
  requirePascalCaseSchema: true,
  requireSingularInput: true,
};

const useClientSuffixOptions = {
  // Ignore Next.js page/layout/route files which need default exports or 'use client' without .client suffix
  ignorePathPatterns: [
    "/app/\\(.*\\)/.*page\\.tsx$",
    "/app/\\(.*\\)/.*layout\\.tsx$",
    "/app/\\(.*\\)/.*loading\\.tsx$",
    "/app/\\(.*\\)/.*error\\.tsx$",
    "/app/\\(.*\\)/.*not-found\\.tsx$",
    "/app/.*page\\.tsx$",
    "/app/.*layout\\.tsx$",
    "/app/.*loading\\.tsx$",
    "/app/.*error\\.tsx$",
    "/app/.*not-found\\.tsx$",
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
const serverDeepImportPatterns = [
  {
    group: ["@/app/*/**", "!@/app/_domains/**"],
    message: serverDeepImportMessage,
  },
  {
    // `@/app/_domains/<domain>` is the barrel and stays allowed; anything below
    // it does not.
    group: ["@/app/_domains/*/**"],
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
  // --- Always-on rules (independent of the agent gate) ---
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
      // Always on per ADR-0012: a client file importing `src/server/errors/`
      // is a correctness problem, not a convention.
      "local/no-client-import-of-server-errors": "error",
    },
  },
  {
    // Step 4 takes this one out of the agent gate: a service throwing a bare
    // `Error` is now rejected by plain `pnpm lint`, so the pre-commit hook
    // catches it.
    files: ["**/_services/**/*.{ts,tsx}"],
    rules: {
      "local/services-no-bare-error": "error",
    },
  },
  {
    // A deep cross-domain import reaches past a domain's public index.ts, so it
    // is an error even outside agent mode.
    files: ["**/src/app/_domains/**/*.{ts,tsx}"],
    rules: {
      "local/no-cross-domain-deep-import": "error",
    },
  },
  {
    // The server folder rule of the architecture document, enforced: a deep
    // import from here into the app tree fails plain `pnpm lint`, and so the
    // pre-commit hook.
    files: ["**/src/server/**/*.{ts,tsx}"],
    ignores: serverDeepImportExemptions,
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: serverDeepImportPatterns },
      ],
    },
  },
  // --- Agent rules (enabled via ESLINT_AGENT_RULES=1) ---
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "local/no-client-import-of-services": migratedSeverity,
    },
  },
  {
    files: ["**/_features/**/*.{ts,tsx}"],
    rules: {
      "local/no-feature-nesting": migratedSeverity,
    },
  },
  {
    files: ["**/_services/**/*.{ts,tsx}"],
    rules: {
      "local/services-verb-prefix": migratedSeverity,
      "local/services-no-trpc-import": migratedSeverity,
      "local/require-trpc-output-type": migratedSeverity,
    },
  },
  {
    // Class strings show up in every file type the app lints, so this one is
    // not scoped to a glob.
    rules: {
      "local/no-raw-tailwind-colors": enableAgentRules
        ? [
            migratedSeverity,
            {
              // Allow explicit palette classes for charting or third-party styling edge-cases.
              allowPatterns: [
                "^fill-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}$",
              ],
              // Ignore generated or low-priority style surfaces, plus the
              // home page illustrations: drawn mock screens keep fixed
              // colours on purpose, independently of the theme.
              ignorePathPatterns: [
                "\\.stories\\.",
                "/emails/",
                "/\\(home\\)/_features/hero/hero-flow-animation\\.client\\.tsx$",
                "/\\(home\\)/_features/how-it-works/flow-animations\\.tsx$",
                "/\\(home\\)/_features/before-after-section\\.tsx$",
                "/\\(home\\)/_features/problem/problem-chat-animation\\.client\\.tsx$",
              ],
            },
          ]
        : "off",
    },
  },
  {
    files: ["**/src/app/_domains/**/*.{ts,tsx}"],
    rules: {
      "local/no-default-export": migratedSeverity,
    },
  },
  {
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      "local/require-use-client-suffix": enableAgentRules
        ? [migratedSeverity, useClientSuffixOptions]
        : "off",
    },
  },
  {
    files: ["**/*.schema.ts"],
    rules: {
      "local/require-schema-conventions": [
        migratedSeverity,
        schemaConventionOptions,
      ],
      "local/schema-must-be-pure-zod": migratedSeverity,
    },
  },
];
