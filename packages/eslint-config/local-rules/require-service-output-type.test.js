import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { requireServiceOutputTypeRule } from "./require-service-output-type.js";

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

const SERVICES = "/repo/apps/web/src/app/_domains/billing/_services";
const CONSUMER =
  "/repo/apps/web/src/app/(authenticated)/_features/billing/plan-card.tsx";

ruleTester.run("require-service-output-type", requireServiceOutputTypeRule, {
  valid: [
    {
      name: "a read service exporting its awaited return type as <Service>Output",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export async function getPlan() {\n  return { id: "1" };\n}\nexport type GetPlanOutput = Awaited<ReturnType<typeof getPlan>>;\n`,
    },
    {
      name: "a read service exporting a bare ReturnType alias",
      filename: `${SERVICES}/list-plans.ts`,
      code: `export function listPlans() {\n  return [];\n}\nexport type ListPlansOutput = ReturnType<typeof listPlans>;\n`,
    },
    {
      name: "a read service exporting the alias with `export type { X }`",
      filename: `${SERVICES}/find-plan.ts`,
      code: `export async function findPlan() {\n  return { id: "1" };\n}\ntype FindPlanOutput = Awaited<ReturnType<typeof findPlan>>;\nexport type { FindPlanOutput };\n`,
    },
    {
      name: "a read service exporting the alias with `export { type X }`",
      filename: `${SERVICES}/has-plan.ts`,
      code: `export async function hasPlan() {\n  return true;\n}\ntype HasPlanOutput = Awaited<ReturnType<typeof hasPlan>>;\nexport { type HasPlanOutput };\n`,
    },
    {
      // A kebab basename cannot carry the house spelling of a proper noun, so
      // the names are compared case-insensitively, as in `services-verb-prefix`.
      name: "a read service whose service name spells a proper noun its own way",
      filename: `${SERVICES}/get-github-installation.ts`,
      code: `export async function getGitHubInstallation() {\n  return null;\n}\nexport type GetGitHubInstallationOutput = Awaited<\n  ReturnType<typeof getGitHubInstallation>\n>;\n`,
    },
    {
      name: "a read service exporting a further type derived from its output",
      filename: `${SERVICES}/find-token.ts`,
      code: `export async function findToken() {\n  return null;\n}\nexport type FindTokenOutput = Awaited<ReturnType<typeof findToken>>;\nexport type Token = NonNullable<FindTokenOutput>;\n`,
    },
    {
      name: "a count service exporting its awaited return type",
      filename: `${SERVICES}/count-invoices.ts`,
      code: `export async function countInvoices() { return 1; }\nexport type CountInvoicesOutput = Awaited<ReturnType<typeof countInvoices>>;\n`,
    },
    {
      name: "a write service",
      filename: `${SERVICES}/cancel-plan.ts`,
      code: `export async function cancelPlan() {}\n`,
    },
    {
      name: "a retired service kept as an empty placeholder",
      filename: `${SERVICES}/get-old.ts`,
      code: `export {};\n`,
    },
    {
      name: "the barrel of a services folder",
      filename: `${SERVICES}/index.ts`,
      code: `export * from "./get-plan";\n`,
    },
    {
      name: "a colocated test file",
      filename: `${SERVICES}/get-plan.test.ts`,
      code: `export const suite = 1;\n`,
    },
    {
      name: "a read-verb file outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/get-plan.ts",
      code: `export async function getPlan() {}\n`,
    },
    {
      name: "a consumer importing the service output alias",
      filename: CONSUMER,
      code: `import type { GetPlanOutput } from "@/app/_domains/billing";\nexport type Props = { plan: GetPlanOutput };\n`,
    },
  ],
  invalid: [
    {
      name: "a read service exporting only its function",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export async function getPlan() {\n  return { id: "1" };\n}\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "a read service exporting an unrelated hand-written type",
      filename: `${SERVICES}/list-plans.ts`,
      code: `export async function listPlans() {\n  return [];\n}\nexport type Plan = { id: string };\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      // The point of the rename: the old rule accepted a `ReturnType` of
      // anything at all.
      name: "an alias named <Service>Output built from another function",
      filename: `${SERVICES}/get-plan.ts`,
      code: `import { getInvoice } from "./get-invoice";\nexport async function getPlan() {\n  return { id: "1" };\n}\nexport type GetPlanOutput = Awaited<ReturnType<typeof getInvoice>>;\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "an alias built from the file's own service under another name",
      filename: `${SERVICES}/find-plan.ts`,
      code: `export async function findPlan() {\n  return [{ id: "1" }];\n}\nexport type Plan = Awaited<ReturnType<typeof findPlan>>;\n`,
      errors: [{ messageId: "wrongName" }],
    },
    {
      name: "a correct alias that is never exported",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export async function getPlan() {\n  return { id: "1" };\n}\ntype GetPlanOutput = Awaited<ReturnType<typeof getPlan>>;\n`,
      errors: [{ messageId: "missing" }],
    },
    {
      name: "a read service inferring its type from the tRPC procedure",
      filename: `${SERVICES}/has-plan.ts`,
      code: `import type { inferProcedureOutput } from "@trpc/server";\nexport async function hasPlan() {\n  return true;\n}\nexport type HasPlanOutput = inferProcedureOutput<AppRouter["billing"]["hasPlan"]>;\n`,
      // Both halves at once: the alias is not derived from the service, and
      // the inference it uses instead is the one the convention replaces.
      errors: [{ messageId: "missing" }, { messageId: "consumerInference" }],
    },
    {
      name: "a consumer inferring the output from a procedure",
      filename: CONSUMER,
      code: `import type { inferProcedureOutput } from "@trpc/server";\nexport type Plan = inferProcedureOutput<AppRouter["billing"]["getPlan"]>;\n`,
      errors: [{ messageId: "consumerInference" }],
    },
    {
      name: "a consumer inferring the outputs of the whole router",
      filename: CONSUMER,
      code: `import type { inferRouterOutputs } from "@trpc/server";\nexport type RouterOutputs = inferRouterOutputs<AppRouter>;\n`,
      errors: [{ messageId: "consumerInference" }],
    },
    {
      name: "a consumer importing the inference helper under an alias",
      filename: CONSUMER,
      code: `import type { inferProcedureOutput as Infer } from "@trpc/server";\nexport type Plan = Infer<AppRouter["billing"]["getPlan"]>;\n`,
      errors: [{ messageId: "consumerInference" }],
    },
  ],
});
