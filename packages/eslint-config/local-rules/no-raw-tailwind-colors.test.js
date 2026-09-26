import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// The options the shared config passes to the rule. The hue-to-token table is
// the rule's own, so the config never passes one.
const configuredOptions = [
  {
    allowPatterns: [
      "^fill-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}$",
    ],
    ignorePathPatterns: [
      "/\\(home\\)/_features/hero/hero-flow-animation\\.client\\.tsx$",
    ],
  },
];

ruleTester.run("no-raw-tailwind-colors", noRawTailwindColorsRule, {
  valid: [
    {
      name: "semantic token classes",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="bg-destructive text-muted-foreground" />;\n`,
    },
    {
      name: "a hue with no token in the table: blue stays until an info token exists",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="bg-blue-50 text-blue-700" />;\n`,
    },
    {
      name: "a hue with no token in the table behind a variant prefix",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="hover:bg-amber-500" />;\n`,
    },
    {
      name: "a chart fill class allowed by allowPatterns",
      filename: "/repo/apps/web/src/components/chart.tsx",
      code: `const Chart = () => <path className="fill-green-500" />;\n`,
      options: configuredOptions,
    },
    {
      name: "a raw color in a home page illustration, exempt by path",
      filename:
        "/repo/apps/web/src/app/(public)/(home)/_features/hero/hero-flow-animation.client.tsx",
      code: `const Hero = () => <span className="text-red-500" />;\n`,
      options: configuredOptions,
    },
    {
      name: "a cn() call with semantic tokens only",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn("bg-card", "text-foreground");\n`,
    },
    {
      name: "a template chunk that cuts a class in half matches nothing",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: "const classes = `text-red-${shade}`;\n",
    },
    {
      name: "a constant map of untokenised hues",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const TONE = { info: "bg-blue-50 text-blue-700" };\n`,
    },
    {
      name: "a utility class that is not a palette color",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="border-2 p-4 text-sm" />;\n`,
    },
  ],
  invalid: [
    {
      name: "a hue in the table names its token in the message",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="text-red-500" />;\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `text-red-500`. Use `text-destructive` instead.",
        },
      ],
    },
    {
      name: "the named token follows the utility of the class",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="border-emerald-400" />;\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `border-emerald-400`. Use `border-success` instead.",
        },
      ],
    },
    {
      name: "a neutral hue names the three tokens that can replace it",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="bg-slate-900/50" />;\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `bg-slate-900/50`. Use one of the `muted`, `border` or `foreground` token classes instead.",
        },
      ],
    },
    {
      name: "a reported hue behind a variant prefix",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="dark:text-green-400" />;\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `dark:text-green-400`. Use `text-success` instead.",
        },
      ],
    },
    {
      name: "a reported hue inside a cn() argument",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn("bg-card", "hover:bg-red-600");\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a reported hue as a conditional object key in cn()",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn({ "text-red-600": isError });\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a reported hue in a template literal className",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: "const Badge = () => <span className={`ring-emerald-300 ${extra}`} />;\n",
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a ternary branch inside a template literal",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: 'const classes = `border ${isError ? "text-red-600" : "text-foreground"}`;\n',
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `text-red-600`. Use `text-destructive` instead.",
        },
      ],
    },
    {
      name: "a constant map of status classes",
      filename: "/repo/apps/web/src/components/status-badge.tsx",
      code: `const STATUS_CLASSES = { resolved: "bg-emerald-50 text-emerald-700" };\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `bg-emerald-50`. Use `bg-success` instead.",
        },
        {
          message:
            "Avoid raw Tailwind color class `text-emerald-700`. Use `text-success` instead.",
        },
      ],
    },
    {
      name: "a cva variant value",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const badge = cva("rounded", { variants: { tone: { danger: "bg-red-100" } } });\n`,
      errors: [
        {
          message:
            "Avoid raw Tailwind color class `bg-red-100`. Use `bg-destructive` instead.",
        },
      ],
    },
    {
      name: "a raw color in any string, not only in a class position",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const label = translate("text-red-500");\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a fill class outside the allowed palette range",
      filename: "/repo/apps/web/src/components/chart.tsx",
      code: `const Chart = () => <path className="fill-gray-500" />;\n`,
      options: configuredOptions,
      errors: [{ messageId: "avoidRawColor" }],
    },
  ],
});
