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
      // Step 3 creates `src/server/errors/`; the rule guards nothing until then.
      "local/no-client-import-of-server-errors": "off",
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
        ? [
            agent,
            {
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
            },
          ]
        : "off",
    },
  },
  {
    files: ["**/*.schema.ts"],
    rules: {
      "local/require-schema-conventions": agent,
      "local/schema-must-be-pure-zod": agent,
    },
  },
];
