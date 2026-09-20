import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { servicesVerbPrefixRule } from "./services-verb-prefix.js";

RuleTester.describe = describe;
RuleTester.it = it;

// Service files carry type exports beside the function, so the TS parser is
// required to see the export forms as they are really written.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const SERVICES = "/repo/apps/web/src/app/_domains/billing/_services";

ruleTester.run("services-verb-prefix", servicesVerbPrefixRule, {
  valid: [
    {
      name: "a read service named after its export",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export function getPlan() {}\n`,
    },
    {
      name: "a write service with a verb from the list",
      filename: `${SERVICES}/create-subscription.ts`,
      code: `export function createSubscription() {}\n`,
    },
    {
      name: "a write verb added through the rule options",
      filename: `${SERVICES}/archive-plan.ts`,
      code: `export function archivePlan() {}\n`,
      options: [{ writeVerbs: ["archive"] }],
    },
    {
      name: "an SDK client module, exempt by suffix",
      filename: `${SERVICES}/stripe-client.ts`,
      code: `export function createStripeClient() {}\nexport function withRetry() {}\n`,
    },
    {
      name: "a named error module, exempt by suffix",
      filename: `${SERVICES}/billing-configuration-error.ts`,
      code: `export class BillingConfigurationError extends Error {}\n`,
    },
    {
      name: "a token cipher, exempt by suffix",
      filename: `${SERVICES}/token-crypto.ts`,
      code: `export function encryptToken() {}\nexport function decryptToken() {}\n`,
    },
    {
      name: "the barrel of a services folder",
      filename: `${SERVICES}/index.ts`,
      code: `export * from "./get-plan";\n`,
    },
    {
      name: "a schema colocated with the services",
      filename: `${SERVICES}/plan.schema.ts`,
      code: `export const PlanSchema = 1;\n`,
    },
    {
      name: "an Inngest job colocated with the services",
      filename: `${SERVICES}/dunning.inngest.ts`,
      code: `export const dunning = 1;\n`,
    },
    {
      name: "a colocated test file",
      filename: `${SERVICES}/get-plan.test.ts`,
      code: `export const x = 1;\n`,
    },
    {
      name: "an underscore-prefixed private helper",
      filename: `${SERVICES}/_internals.ts`,
      code: `export function anything() {}\n`,
    },
    {
      name: "a file outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `export function plan() {}\n`,
    },
    {
      name: "the exported name keeps the house spelling of a proper noun",
      filename: `${SERVICES}/get-github-installation.ts`,
      code: `export async function getGitHubInstallation() {}\n`,
    },
    {
      name: "an arrow function named after the file",
      filename: `${SERVICES}/list-plans.ts`,
      code: `export const listPlans = async () => [];\n`,
    },
    {
      name: "`export { … }` of the function the file is named after",
      filename: `${SERVICES}/get-plan.ts`,
      code: `function getPlan() {}\nexport { getPlan };\n`,
    },
    {
      name: "a derived output type beside the service",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export function getPlan() {}\nexport type GetPlanOutput = ReturnType<typeof getPlan>;\n`,
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
  ],
  invalid: [
    {
      name: "a service named after the entity only",
      filename: `${SERVICES}/plan.ts`,
      code: `export function getPlan() {}\n`,
      errors: [{ messageId: "missingVerbPrefix" }],
    },
    {
      name: "a camelCase filename without a verb prefix",
      filename: `${SERVICES}/planLookup.ts`,
      code: `export function planLookup() {}\n`,
      errors: [{ messageId: "missingVerbPrefix" }],
    },
    {
      name: "a noun-dash-noun filename that is not an exempt module kind",
      filename: `${SERVICES}/plan-summary.ts`,
      code: `export function planSummary() {}\n`,
      errors: [{ message: /`plan-` is not a known service verb/ }],
    },
    {
      name: "a verb the config does not list",
      filename: `${SERVICES}/archive-plan.ts`,
      code: `export function archivePlan() {}\n`,
      errors: [{ messageId: "unknownVerb" }],
    },
    {
      name: "the report says how to add a verb",
      filename: `${SERVICES}/archive-plan.ts`,
      code: `export function archivePlan() {}\n`,
      errors: [
        {
          message: /add it to `serviceVerbOptions\.writeVerbs`/,
        },
      ],
    },
    {
      name: "the banned `edit-` synonym",
      filename: `${SERVICES}/edit-plan.ts`,
      code: `export function editPlan() {}\n`,
      errors: [{ messageId: "bannedSynonym" }],
    },
    {
      name: "the banned `save-` synonym",
      filename: `${SERVICES}/save-plan.ts`,
      code: `export function savePlan() {}\n`,
      errors: [{ messageId: "bannedSynonym" }],
    },
    {
      name: "a process verb where a computed read belongs",
      filename: `${SERVICES}/compute-plan-price.ts`,
      code: `export function computePlanPrice() {}\n`,
      errors: [{ messageId: "processVerb" }],
    },
    {
      name: "the `resolve-` process verb",
      filename: `${SERVICES}/resolve-plan.ts`,
      code: `export function resolvePlan() {}\n`,
      errors: [{ messageId: "processVerb" }],
    },
    {
      name: "the `get-all-` prefix",
      filename: `${SERVICES}/get-all-plans.ts`,
      code: `export function getAllPlans() {}\n`,
      errors: [{ messageId: "bannedPrefix" }],
    },
    {
      name: "the `get-paginated-` prefix",
      filename: `${SERVICES}/get-paginated-plans.ts`,
      code: `export function getPaginatedPlans() {}\n`,
      errors: [{ messageId: "bannedPrefix" }],
    },
    {
      name: "a suffix the config does not exempt",
      filename: `${SERVICES}/stripe-client.ts`,
      code: `export function createStripeClient() {}\n`,
      options: [{ exemptSuffixes: [] }],
      errors: [{ messageId: "unknownVerb" }],
    },
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
  ],
});
