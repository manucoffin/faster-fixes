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

// The only convention rule still ramping in as a warning: its count is the
// remaining burn-down metric, so it must not fail `lint:agent-rules`.
const agent = enableAgentRules ? "warn" : "off";
// Steps 2 and 3 are done: every scope under `src/app` has the final bucket set,
// so a violation of a step 2 or step 3 rule is a regression on migrated code,
// not a burn-down item. Still behind the agent gate until step 4.
const migratedSeverity = enableAgentRules ? "error" : "off";

// Both options are the repo convention, not opt-in extras: a schema const is
// PascalCase (`CreateInvoiceSchema`) and its input type is singular
// (`CreateInvoiceInput`). Wiring them is what makes the plural `Inputs` aliases
// visible in the burn-down instead of silently passing.
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
      // `src/server/errors/` exists since the step 3 prerequisite, and zero
      // violations are possible today, so ADR-0012 has this one land straight
      // at `error` rather than in the burn-down.
      "local/no-client-import-of-server-errors": "error",
    },
  },
  {
    // Step 4 takes this one out of the agent gate: a service throwing a bare
    // `Error` is now rejected by plain `pnpm lint`, so the pre-commit hook
    // catches it. `src/server/**` joins the sweep in step 5, when those files
    // move into a domain.
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
    // The one impure schema of the app suppresses `schema-must-be-pure-zod`
    // inline while step 5 still owns the plan configuration. That rule is
    // agent-gated, so outside the gate the directive would be reported as
    // unused. Delete this block with the suppression when the enums move.
    files: ["**/src/app/admin/users/_services/create-subscription.schema.ts"],
    linterOptions: { reportUnusedDisableDirectives: "off" },
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
            agent,
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
