import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noClientImportOfServicesRule } from "./no-client-import-of-services.js";

RuleTester.describe = describe;
RuleTester.it = it;

// The TypeScript parser is needed because the rule exempts `import type`.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run("no-client-import-of-services", noClientImportOfServicesRule, {
  valid: [
    {
      name: "a client module re-exporting a service type",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `export type { Plan } from "./_services/get-plan";\n`,
    },
    {
      name: "a client module re-exporting a schema from a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `export { planSchema } from "./_services/plan.schema";\n`,
    },
    {
      name: "a server module importing a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-card.tsx",
      code: `import { getPlan } from "./_services/get-plan";\n`,
    },
    {
      name: "a client module importing a schema from a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import { planSchema } from "./_services/plan.schema";\n`,
    },
    {
      name: "a client module type-importing a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import type { Plan } from "./_services/get-plan";\n`,
    },
    {
      name: "a client module with only type specifiers",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import { type Plan } from "./_services/get-plan";\n`,
    },
    {
      name: "a client module importing a path that only looks like services",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import { helper } from "./_services-legacy/helper";\n`,
    },
  ],
  invalid: [
    {
      name: "a client module re-exporting a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `export { getPlan } from "./_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a client module star-re-exporting a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `export * from "./_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a client module dynamically importing a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `const load = () => import("./_services/get-plan");\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a client module reaching a service by a relative path that climbs",
      filename:
        "/repo/apps/web/src/app/_domains/billing/plan/plan-form.client.tsx",
      code: `import { getInvoice } from "../../invoice/_services/get-invoice";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a .client.ts module importing a service",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.client.ts",
      code: `import { getPlan } from "./_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a .client.tsx module importing a service",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import { getPlan } from "./_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a 'use client' module importing a service by alias",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.tsx",
      code: `"use client";\nimport { getPlan } from "@/app/_domains/billing/_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
    {
      name: "a client module mixing a value and a type specifier",
      filename: "/repo/apps/web/src/app/_domains/billing/plan-form.client.tsx",
      code: `import { getPlan, type Plan } from "./_services/get-plan";\n`,
      errors: [{ messageId: "clientImportsService" }],
    },
  ],
});
