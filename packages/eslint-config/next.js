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

// Convention rules ramp in as warnings: the count per rule is the migration
// burn-down metric, so they must not fail `lint:agent-rules`.
const agent = enableAgentRules ? "warn" : "off";
// Step 3 flips this to "error" per migrated `_services/` scope.
const servicesRulesSeverity = agent;
// Step 2 locked `_domains/`: the scope is migrated, so a default export there is
// a regression, not a burn-down item. Still behind the agent gate.
const domainRulesSeverity = enableAgentRules ? "error" : "off";
// The severity a scope listed in `migratedScopes` gets: a violation there is a
// regression on migrated code, not a burn-down item.
const lockedSeverity = domainRulesSeverity;

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
 * Scopes under `apps/web/src/app` that step 3 has already migrated, written as
 * glob fragments relative to `src/app` (route groups keep their parentheses,
 * e.g. `"(public)"`, `"(authenticated)/account"`, `"_domains/auth"`).
 *
 * Listing a scope raises this step's rules from `warn` to `error` for that
 * scope alone, so a regression on migrated code fails `pnpm lint:agent-rules`
 * while the rest of the tree keeps burning down as warnings.
 *
 * Temporary: the final lock of step 3 deletes this array and sets the rules to
 * `error` unconditionally.
 *
 * @type {string[]}
 */
export const migratedScopes = [
  "(public)",
  "(auth)",
  "_domains/auth",
  "_domains/organization",
  "_domains/subscription",
  "_domains/user",
];

/**
 * The two config blocks a locked scope gets: the services rules on its
 * `_services/` files, the general convention rules on everything under it.
 *
 * Every rule below self-guards on the file name it targets, so the wide glob on
 * the second block costs nothing: `require-schema-conventions` only looks at
 * `*.schema.ts`, `no-feature-nesting` only at nested `_features/`.
 *
 * @param {string} scope glob fragment relative to `src/app`
 * @param {"error" | "warn" | "off"} severity
 * @returns {import("eslint").Linter.Config[]}
 */
export function migratedScopeConfigs(scope, severity) {
  return [
    {
      files: [`**/src/app/${scope}/**/_services/**/*.{ts,tsx}`],
      rules: {
        "local/services-verb-prefix": severity,
        "local/services-no-trpc-import": severity,
        "local/require-trpc-output-type": severity,
        // Step 4 makes this one always-on; here it is locked per scope.
        "local/services-no-bare-error": severity,
      },
    },
    {
      files: [`**/src/app/${scope}/**/*.{ts,tsx}`],
      rules: {
        "local/no-client-import-of-services": severity,
        "local/no-feature-nesting": severity,
        "local/require-schema-conventions": [severity, schemaConventionOptions],
        "local/schema-must-be-pure-zod": severity,
        "local/require-use-client-suffix": [severity, useClientSuffixOptions],
      },
    },
  ];
}

const lockedScopeConfigs = migratedScopes.flatMap((scope) =>
  migratedScopeConfigs(scope, lockedSeverity),
);

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
    // A deep cross-domain import reaches past a domain's public index.ts, so it
    // is an error even outside agent mode.
    files: ["**/src/app/_domains/**/*.{ts,tsx}"],
    rules: {
      "local/no-cross-domain-deep-import": "error",
    },
  },
  // Transition: the pre-migration tRPC procedure files all carry a module-level
  // `"use server"`. Steps 2 and 3 move them into `_services/`; drop this entry
  // then so the rule covers them too.
  {
    files: ["**/*.trpc.query.{ts,tsx}", "**/*.trpc.mutation.{ts,tsx}"],
    rules: {
      "local/require-server-action-suffix": "off",
    },
  },
  // --- Agent rules (enabled via ESLINT_AGENT_RULES=1) ---
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "local/no-client-import-of-services": agent,
    },
  },
  {
    files: ["**/_features/**/*.{ts,tsx}"],
    rules: {
      "local/no-feature-nesting": agent,
    },
  },
  {
    files: ["**/_services/**/*.{ts,tsx}"],
    rules: {
      "local/services-verb-prefix": servicesRulesSeverity,
      "local/services-no-trpc-import": servicesRulesSeverity,
      "local/require-trpc-output-type": servicesRulesSeverity,
      // Step 4 makes this one always-on.
      "local/services-no-bare-error": servicesRulesSeverity,
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
              // Ignore generated or low-priority style surfaces.
              ignorePathPatterns: ["\\.stories\\.", "/emails/"],
            },
          ]
        : "off",
    },
  },
  {
    files: ["**/src/app/_domains/**/*.{ts,tsx}"],
    rules: {
      "local/no-default-export": domainRulesSeverity,
    },
  },
  {
    files: ["**/src/**/*.{ts,tsx}"],
    rules: {
      "local/require-use-client-suffix": enableAgentRules
        ? [agent, useClientSuffixOptions]
        : "off",
    },
  },
  {
    files: ["**/*.schema.ts"],
    rules: {
      "local/require-schema-conventions": [agent, schemaConventionOptions],
      "local/schema-must-be-pure-zod": agent,
    },
  },
  // --- Per-scope locks (last, so they override the ramp above) ---
  ...lockedScopeConfigs,
];
