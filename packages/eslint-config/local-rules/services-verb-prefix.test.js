import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { servicesVerbPrefixRule } from "./services-verb-prefix.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("services-verb-prefix", servicesVerbPrefixRule, {
  valid: [
    {
      name: "a read service named after its export",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export function getPlan() {}\n`,
    },
    {
      name: "a write service with a precise verb",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/cancel-subscription.ts",
      code: `export function cancelSubscription() {}\n`,
    },
    {
      name: "the barrel of a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/index.ts",
      code: `export * from "./get-plan";\n`,
    },
    {
      name: "a schema colocated with the services",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/plan.schema.ts",
      code: `export const planSchema = 1;\n`,
    },
    {
      name: "an Inngest job colocated with the services",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/dunning.inngest.ts",
      code: `export const dunning = 1;\n`,
    },
    {
      name: "a colocated test file",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/get-plan.test.ts",
      code: `export const x = 1;\n`,
    },
    {
      name: "an underscore-prefixed private helper",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/_internals.ts",
      code: `export const x = 1;\n`,
    },
    {
      name: "a file outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/plan.ts",
      code: `export const plan = 1;\n`,
    },
  ],
  invalid: [
    {
      name: "a service named after the entity only",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/plan.ts",
      code: `export function getPlan() {}\n`,
      errors: [{ messageId: "missingVerbPrefix" }],
    },
    {
      name: "a camelCase filename without a verb prefix",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/planLookup.ts",
      code: `export function planLookup() {}\n`,
      errors: [{ messageId: "missingVerbPrefix" }],
    },
    {
      name: "the banned `edit-` synonym",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/edit-plan.ts",
      code: `export function editPlan() {}\n`,
      errors: [{ messageId: "bannedSynonym" }],
    },
    {
      name: "the banned `save-` synonym",
      filename:
        "/repo/apps/web/src/app/_domains/billing/_services/save-plan.ts",
      code: `export function savePlan() {}\n`,
      errors: [{ messageId: "bannedSynonym" }],
    },
  ],
});
