import pluginEslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

import { localRulesPlugin } from "./local-rules/index.js";
import { withBinarySeverity } from "./severity.js";

// The one exception to the double-cast ban: a service test builds a partial
// fake of the Prisma client and passes it through the dependency-injection
// seam, whose parameter type is the real client. A partial object cannot reach
// that type without the widening step, and giving the double a hand-written
// type would mean writing out a surface the test does not use. The other two
// patterns of the rule still apply to a test file.
const restrictedPatternOptions = {
  allowDoubleCastPathPatterns: ["\\.test\\.tsx?$"],
};

/**
 * A shared ESLint configuration for the repository: the generic TypeScript
 * rules every workspace is held to. Architecture rules live in `next.js`,
 * because they describe the web app tree.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = withBinarySeverity([
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
    },
  },
  {
    ignores: ["dist/**"],
  },
  {
    rules: {
      // A `_` prefix marks a binding the caller imposes but this code ignores
      // on purpose; every other unused binding is dead code.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // `== null` is the one loose comparison worth keeping: it reads as
      // "null or undefined" in a single test.
      eqeqeq: ["error", "smart"],
      "object-shorthand": "error",
      // English identifiers only, which in practice means ASCII.
      "id-match": ["error", "^[\\x00-\\x7F]*$"],
    },
  },
  {
    // The code-shape conventions, on the source tree of every workspace: a
    // config or script file at a workspace root is not held to them.
    files: ["**/src/**/*.{ts,tsx}"],
    plugins: {
      local: localRulesPlugin,
    },
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
      "@typescript-eslint/no-inferrable-types": "error",
      // A ternary inside a ternary is a branch a reader has to unpick; an early
      // return or a lookup says the same thing in reading order.
      "no-nested-ternary": "error",
      // An `else` after a `return` is a block that could be the rest of the
      // function, and so is an `else if`.
      "no-else-return": ["error", { allowElseIf: false }],
      // Past three nested blocks, the function wants early returns or a
      // helper.
      "max-depth": ["error", 3],
      // No `enum`, no `as unknown as`, no `query.data ?? []`.
      "local/no-restricted-patterns": ["error", restrictedPatternOptions],
      // The one non-negotiable of the house style that a linter can hold: no
      // em dash in user-facing text. Only the node kinds that can carry copy
      // are read, so a comment keeps its dashes.
      "local/no-em-dash-in-copy": "error",
      // `console.log` and `console.debug` are debugging leftovers. `info`,
      // `warn` and `error` are the deliberate operational log lines: no
      // logger exists, and the host captures stdout.
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "prefer-template": "error",
      // A single-line body may drop its braces; a body that wraps may not.
      curly: ["error", "multi-line"],
    },
  },
  {
    // Every linted path, config files included: one spelling for a file name,
    // so a file is found by what it is called. Route segments and `_` buckets
    // keep their framework spelling.
    plugins: {
      local: localRulesPlugin,
    },
    rules: {
      "local/kebab-case-path": "error",
    },
  },
  {
    // The type-aware rules: what neither `tsc` nor a syntactic rule can see,
    // and what generated code gets wrong most. Each one reports nothing today,
    // so a report is a regression.
    files: ["**/src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/await-thenable": "error",
      // A promise nobody awaits loses its rejection and its ordering. `await`
      // or `return` it; `void` says the fire-and-forget is on purpose.
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true },
      ],
      // JSX attributes are left out: `onClick={async () => …}` is the React
      // idiom, and the handler's rejection is the mutation's to report.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // An `any` spreads silently: once assigned, passed, read or returned, the
      // compiler stops checking everything downstream of it. Data from outside
      // (`JSON.parse`, `postMessage`, a fetch body) is parsed with Zod instead.
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      // A check the types already settle (`?.` on a value that cannot be
      // nullish, `if (x)` on a value that is always truthy) is defensive code
      // that hides what the value really is. Fix the type, or drop the check.
      "@typescript-eslint/no-unnecessary-condition": "error",
      // `||` also replaces `0`, `""` and `false`. `??` replaces only a
      // missing value, which is almost always what a fallback means.
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      // `!` tells the compiler to stop checking. Narrow the value, or fail
      // with a named error when the invariant does not hold.
      "@typescript-eslint/no-non-null-assertion": "error",
      // Inside `try`, a returned promise must be awaited or its rejection
      // escapes the `catch`; elsewhere the `await` is noise.
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      // `${object}` prints `[object Object]`.
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/no-deprecated": "error",
      // Only Error instances carry a stack, so only they may be thrown. The
      // type-aware form of the core `no-throw-literal`, which it replaces.
      "no-throw-literal": "off",
      "@typescript-eslint/only-throw-error": "error",
      // A `switch` over a union handles every member, or says `default`.
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
    },
  },
  {
    // A test asserts on loosely typed values on purpose (`expect.any(...)`,
    // `mock.calls[0]`), and the assertion is the check. The rest of the
    // `no-unsafe-*` family still applies.
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      // `mock.calls[0]!` on a value the test just arranged: if the invariant
      // breaks, the test fails, which is the check.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  // The exception surface: a rule may be switched off in a file, in writing.
  // A stale exception is a report of its own, so an exception that outlives
  // its reason is deleted rather than inherited.
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    plugins: {
      "eslint-comments": pluginEslintComments,
    },
    rules: {
      "eslint-comments/require-description": "error",
    },
  },
]);
