import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { servicesFilenameMatchesExportRule } from "./services-filename-matches-export.js";

RuleTester.describe = describe;
RuleTester.it = it;

// Service files carry type exports beside the function, so the TS parser is
// required to tell a type export from a value export.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const SERVICES = "/repo/apps/web/src/app/_domains/billing/_services";
const EXEMPT_SUFFIXES = [{ exemptSuffixes: ["client", "error"] }];

ruleTester.run(
  "services-filename-matches-export",
  servicesFilenameMatchesExportRule,
  {
    valid: [
      {
        name: "a function declaration named after the file, with its output type",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export async function getPlan() {}\nexport type GetPlanOutput = Awaited<ReturnType<typeof getPlan>>;\n`,
      },
      {
        name: "an arrow function constant named after the file",
        filename: `${SERVICES}/list-plans.ts`,
        code: `export const listPlans = async () => [];\n`,
      },
      {
        name: "a wrapped service still counts",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export const getPlan = cache(async () => null);\n`,
      },
      {
        name: "`export type { … }` of the derived alias",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export function getPlan() {}\ntype GetPlanOutput = ReturnType<typeof getPlan>;\nexport type { GetPlanOutput };\n`,
      },
      {
        name: "an inner function that is not exported",
        filename: `${SERVICES}/get-plan.ts`,
        code: `function toRow() {}\nexport function getPlan() {\n  return toRow();\n}\n`,
      },
      {
        name: "an exported constant that is not a function",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export const PLAN_SELECT = { id: true };\nexport function getPlan() {}\n`,
      },
      {
        name: "a local export list naming the operation, declared after it",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export { getPlan };\nfunction getPlan() {}\n`,
      },
      {
        name: "a local export list naming the operation",
        filename: `${SERVICES}/delete-plan.ts`,
        code: `function deletePlan() {}\nexport { deletePlan };\n`,
      },
      {
        name: "a proper noun keeps its house spelling",
        filename: `${SERVICES}/get-github-installation.ts`,
        code: `export function getGitHubInstallation() {}\n`,
      },
      {
        name: "a file in a nested _services subfolder",
        filename: `${SERVICES}/_webhooks/handle-stripe-event.ts`,
        code: `export function handleStripeEvent() {}\n`,
      },
      {
        name: "a file outside _services is ignored",
        filename:
          "/repo/apps/web/src/app/_domains/billing/_helpers/get-plan.ts",
        code: `export function somethingElse() {}\n`,
      },
      {
        name: "a schema file is exempt",
        filename: `${SERVICES}/create-plan.schema.ts`,
        code: `export const createPlanSchema = {};\n`,
      },
      {
        name: "an Inngest job is exempt",
        filename: `${SERVICES}/sync-plans.inngest.ts`,
        code: `export const syncPlansFunction = {};\n`,
      },
      {
        name: "a test file is exempt",
        filename: `${SERVICES}/get-plan.test.ts`,
        code: `it("works", () => {});\n`,
      },
      {
        name: "the barrel is exempt",
        filename: `${SERVICES}/index.ts`,
        code: `export { getPlan } from "./get-plan";\n`,
      },
      {
        name: "a retired underscore-prefixed stub is exempt",
        filename: `${SERVICES}/_deprecated_get-plan.ts`,
        code: `// Retired: moved to get-billing-plan.ts\n`,
      },
      {
        name: "a noun-named module with an exempt suffix",
        filename: `${SERVICES}/stripe-client.ts`,
        code: `export function createStripeClient() {}\n`,
        options: EXEMPT_SUFFIXES,
      },
    ],
    invalid: [
      {
        name: "an exported function that drifted from the file name",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export function fetchPlan() {}\n`,
        errors: [
          {
            message:
              /`fetchPlan` is exported from `get-plan\.ts`.+rename the function to `getPlan`/,
          },
        ],
      },
      {
        name: "the renamed operation is one report, not a missing export too",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export async function getBillingPlan() {}\n`,
        errors: [
          {
            messageId: "exportNameMismatch",
            data: {
              exported: "getBillingPlan",
              basename: "get-plan.ts",
              expected: "getPlan",
            },
          },
        ],
      },
      {
        name: "each drifted function is reported",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export function fetchPlan() {}\nexport function loadPlan() {}\n`,
        errors: [
          { messageId: "exportNameMismatch" },
          { messageId: "exportNameMismatch" },
        ],
      },
      {
        name: "a second exported function riding along",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export function getPlan() {}\nexport function isFreePlan() {\n  return true;\n}\n`,
        errors: [{ messageId: "exportNameMismatch" }],
      },
      {
        name: "an exported arrow function that drifted from the file name",
        filename: `${SERVICES}/list-plans.ts`,
        code: `export const listAllPlans = async () => [];\n`,
        errors: [{ messageId: "exportNameMismatch" }],
      },
      {
        name: "`export { … }` of a function the file is not named after",
        filename: `${SERVICES}/get-plan.ts`,
        code: `function getPlan() {}\nfunction isFreePlan() {}\nexport { getPlan, isFreePlan };\n`,
        errors: [{ messageId: "exportNameMismatch" }],
      },
      {
        name: "a non-function value under another name is a missing export",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export const planSelect = { id: true };\n`,
        errors: [
          {
            messageId: "missingNamedExport",
            data: { basename: "get-plan.ts", expected: "getPlan" },
          },
        ],
      },
      {
        name: "only types are exported",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export type GetPlanOutput = string;\nexport interface getPlan {}\n`,
        errors: [{ messageId: "missingNamedExport" }],
      },
      {
        name: "a type-only export list does not count",
        filename: `${SERVICES}/get-plan.ts`,
        code: `type getPlan = string;\nexport type { getPlan };\n`,
        errors: [{ messageId: "missingNamedExport" }],
      },
      {
        name: "a default export does not count",
        filename: `${SERVICES}/get-plan.ts`,
        code: `export default function getPlan() {}\n`,
        errors: [{ messageId: "missingNamedExport" }],
      },
      {
        name: "a noun-named module without the suffix option is reported",
        filename: `${SERVICES}/stripe-client.ts`,
        code: `export function createStripeClient() {}\n`,
        errors: [{ messageId: "exportNameMismatch" }],
      },
    ],
  },
);
