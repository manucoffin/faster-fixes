import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { requireTrpcOutputTypeRule } from "./require-trpc-output-type.js";

RuleTester.describe = describe;
RuleTester.it = it;

// The rule reads TypeScript type aliases, so the TS parser is required.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run("require-trpc-output-type", requireTrpcOutputTypeRule, {
  valid: [
    {
      name: "a read service exporting its awaited return type",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export async function getPlan() {\n  return { id: "1" };\n}\nexport type GetPlan = Awaited<ReturnType<typeof getPlan>>;\n`,
    },
    {
      name: "a read service exporting a bare ReturnType alias",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/list-plans.ts",
      code: `export function listPlans() {\n  return [];\n}\nexport type ListPlans = ReturnType<typeof listPlans>;\n`,
    },
    {
      name: "a read service exporting an element of its return type",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/find-plan.ts",
      code: `export async function findPlan() {\n  return [{ id: "1" }];\n}\nexport type Plan = Awaited<ReturnType<typeof findPlan>>[number];\n`,
    },
    {
      name: "a count service exporting its awaited return type",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/count-invoices.ts",
      code: `export async function countInvoices() { return 1; }\nexport type CountInvoicesOutput = Awaited<ReturnType<typeof countInvoices>>;\n`,
    },
    {
      name: "a write service",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/cancel-plan.ts",
      code: `export async function cancelPlan() {}\n`,
    },
    {
      name: "a retired service kept as an empty placeholder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-old.ts",
      code: `export {};\n`,
    },
    {
      name: "the barrel of a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/index.ts",
      code: `export * from "./get-plan";\n`,
    },
    {
      name: "a colocated test file",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/get-plan.test.ts",
      code: `export const suite = 1;\n`,
    },
    {
      name: "a read-verb file outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/get-plan.ts",
      code: `export async function getPlan() {}\n`,
    },
  ],
  invalid: [
    {
      name: "a count service exporting only its function",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/count-invoices.ts",
      code: `export async function countInvoices() { return 1; }\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "a read service exporting only its function",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export async function getPlan() {\n  return { id: "1" };\n}\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "a read service exporting an unrelated hand-written type",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/list-plans.ts",
      code: `export async function listPlans() {\n  return [];\n}\nexport type Plan = { id: string };\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "a read service inferring the type from the tRPC procedure",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/has-plan.ts",
      code: `export async function hasPlan() {\n  return true;\n}\nexport type HasPlan = inferProcedureOutput<AppRouter["billing"]["hasPlan"]>;\n`,
      errors: [{ messageId: "missing" }],
    },
  ],
});
