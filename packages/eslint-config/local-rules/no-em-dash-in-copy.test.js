import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noEmDashInCopyRule } from "./no-em-dash-in-copy.js";

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

// Built from its code point, like the rule's own pattern: a suite about a
// banned character should not be the one file that plants one, and Prettier
// rewrites an escape of it inside a string back to the character anyway.
const DASH = String.fromCodePoint(0x2014);

const FEATURE =
  "/repo/apps/web/src/app/(public)/pricing/_features/plan-card.tsx";

ruleTester.run("no-em-dash-in-copy", noEmDashInCopyRule, {
  valid: [
    {
      name: "a sentence broken by a comma",
      filename: FEATURE,
      code: `export const label = "One project, fifty items a month.";\n`,
    },
    {
      name: "a sentence broken by a colon",
      filename: FEATURE,
      code: `export const label = "It captures three things: the screenshot, the URL, the logs.";\n`,
    },
    {
      name: "a hyphen and an en dash, which are not the banned character",
      filename: FEATURE,
      code: `export const label = "Self-hosted, pages 3\u20134, 2026-05-24";\n`,
    },
    {
      name: "a line comment, which no reader of the site sees",
      filename: FEATURE,
      code: `// Free ${DASH} the trial tier ${DASH} has no card.\nexport const tier = "free";\n`,
    },
    {
      name: "a block comment and a JSDoc",
      filename: FEATURE,
      code: `/* Free ${DASH} no card. */\n/** Reads the plan ${DASH} the paid one. */\nexport function plan() {\n  return "pro";\n}\n`,
    },
    {
      name: "a template literal whose static chunks are clean",
      filename: FEATURE,
      code: `export const label = (n: number) => \`${"$"}{n} projects, ${"$"}{n} seats\`;\n`,
    },
    {
      name: "JSX text with no dash at all",
      filename: FEATURE,
      code: `export function Card() {\n  return <p>Free for one project.</p>;\n}\n`,
    },
  ],
  invalid: [
    {
      name: "a string literal",
      filename: FEATURE,
      code: `export const label = "Free ${DASH} one project.";\n`,
      errors: [{ messageId: "emDash" }],
    },
    {
      name: "a JSX attribute value, which is a string literal too",
      filename: FEATURE,
      code: `export function Card() {\n  return <img alt="The inbox ${DASH} unread first" src="/a.png" />;\n}\n`,
      errors: [{ messageId: "emDash" }],
    },
    {
      name: "JSX text between tags",
      filename: FEATURE,
      code: `export function Card() {\n  return <p>Free ${DASH} for one project.</p>;\n}\n`,
      errors: [{ messageId: "emDash" }],
    },
    {
      name: "a template element, in the chunk after the interpolation",
      filename: FEATURE,
      code: `export const label = (n: number) => \`${"$"}{n} projects ${DASH} one seat\`;\n`,
      errors: [{ messageId: "emDash" }],
    },
    {
      name: "every chunk of a template that carries one",
      filename: FEATURE,
      code: `export const label = (n: number) => \`Plans ${DASH} ${"$"}{n} seats ${DASH} billed monthly\`;\n`,
      errors: [{ messageId: "emDash" }, { messageId: "emDash" }],
    },
    {
      name: "copy in a service, which reaches the reader through the API",
      filename:
        "/repo/apps/web/src/app/_domains/feedback/_services/create-feedback.ts",
      code: `export const CONFLICT = "That status ${DASH} already set ${DASH} cannot change.";\n`,
      errors: [{ messageId: "emDash" }],
    },
    {
      name: "a file whose comment is clean and whose copy is not",
      filename: FEATURE,
      code: `// The paid tier.\nexport const label = "Pro ${DASH} unlimited projects.";\n`,
      errors: [{ messageId: "emDash" }],
    },
  ],
});
