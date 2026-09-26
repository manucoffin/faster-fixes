import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noDefaultExportRule } from "./no-default-export.js";

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

// The shape the shared config passes: one anchored pattern covering the
// Next.js special files, whose default export the framework requires.
const nextSpecialFileOptions = [
  {
    ignorePathPatterns: [
      "/app/(?:.*/)?(?:error|layout|manifest|not-found|page|sitemap)\\.tsx?$",
    ],
  },
];

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
    {
      name: "a Next.js page, whose default export the framework requires",
      filename: "/repo/apps/web/src/app/(authenticated)/projects/page.tsx",
      code: `export default function Page() {}\n`,
      options: nextSpecialFileOptions,
    },
    {
      name: "a Next.js metadata file in .ts",
      filename: "/repo/apps/web/src/app/sitemap.ts",
      code: `export default function sitemap() {\n  return [];\n}\n`,
      options: nextSpecialFileOptions,
    },
    {
      name: "a type-only re-export under its own name",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `export type { Plan } from "./plan.schema";\n`,
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
    {
      name: "a component outside the domains folder",
      filename: "/repo/apps/web/src/app/_components/toolbar.tsx",
      code: `export default function Toolbar() {}\n`,
      errors: [{ messageId: "noDefault" }],
    },
    {
      name: "a local binding aliased to default",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `function PlanCard() {}\nexport { PlanCard as default };\n`,
      errors: [{ messageId: "aliasedDefault" }],
    },
    {
      name: "a re-export aliased to default",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `export { PlanCard as default } from "./plan-card.client";\n`,
      errors: [{ messageId: "aliasedDefault" }],
    },
    {
      name: "a bare default re-export",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `export { default } from "./plan-card.client";\n`,
      errors: [{ messageId: "aliasedDefault" }],
    },
    {
      name: "a file whose name merely ends in a Next.js special file name",
      filename:
        "/repo/apps/web/src/app/(authenticated)/projects/_features/edit-page.tsx",
      code: `export default function EditPage() {}\n`,
      options: nextSpecialFileOptions,
      errors: [{ messageId: "noDefault" }],
    },
  ],
});
