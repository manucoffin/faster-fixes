import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noDefaultExportRule } from "./no-default-export.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-default-export", noDefaultExportRule, {
  valid: [
    {
      name: "a named function export",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `export function PlanCard() {}\n`,
    },
    {
      name: "a named const export",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `export const plan = { id: "free" };\n`,
    },
    {
      name: "a re-export of a default from a third-party module",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `export { default as Chart } from "chart-lib";\n`,
    },
  ],
  invalid: [
    {
      name: "a default function export",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `export default function PlanCard() {}\n`,
      errors: [{ messageId: "noDefault" }],
    },
    {
      name: "a default expression export",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `const plan = { id: "free" };\nexport default plan;\n`,
      errors: [{ messageId: "noDefault" }],
    },
  ],
});
