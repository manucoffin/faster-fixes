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

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
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
  // --- Agent rules (enabled via ESLINT_AGENT_RULES=1) ---
  {
    files: [
      "**/*.trpc.query.ts",
      "**/*.trpc.query.tsx",
      "**/*.trpc.mutation.ts",
      "**/*.trpc.mutation.tsx",
    ],
    rules: {
      "local/require-trpc-output-type": enableAgentRules ? "error" : "off",
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "local/no-raw-tailwind-colors": enableAgentRules
        ? [
            "error",
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
    files: ["**/src/app/_features/**/*.{ts,tsx}"],
    rules: {
      "local/no-default-export": enableAgentRules ? "error" : "off",
      "local/require-use-client-suffix": enableAgentRules
        ? [
            "error",
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
      "local/require-schema-conventions": enableAgentRules ? "error" : "off",
    },
  },
];
