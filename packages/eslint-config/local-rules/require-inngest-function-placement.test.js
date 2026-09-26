import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { requireInngestFunctionPlacementRule } from "./require-inngest-function-placement.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

const DOMAIN = "/repo/apps/web/src/app/_domains/integration";

ruleTester.run(
  "require-inngest-function-placement",
  requireInngestFunctionPlacementRule,
  {
    valid: [
      {
        name: "a durable function in an inngest service",
        filename: `${DOMAIN}/_services/jira/create-jira-issue.inngest.ts`,
        code: `import { inngest } from "@/server/inngest";\nexport const createJiraIssue = inngest.createFunction({ id: "create-jira-issue" }, { event: "jira/issue.requested" }, async () => {});\n`,
      },
      {
        name: "the Inngest client itself, which is wiring and not a function",
        filename: "/repo/apps/web/src/server/inngest/index.ts",
        code: `import { Inngest } from "inngest";\nexport const inngest = new Inngest({ id: "faster-fixes" });\n`,
      },
      {
        name: "an ordinary service calling something else",
        filename: `${DOMAIN}/_services/jira/create-jira-issue.ts`,
        code: `export async function createJiraIssue(client) {\n  return client.createIssue();\n}\n`,
      },
      {
        name: "a method that merely ends in the same word",
        filename: `${DOMAIN}/_services/jira/create-jira-issue.ts`,
        code: `export function createJiraIssue(factory) {\n  return factory.createFunctionName();\n}\n`,
      },
      {
        name: "a test beside an inngest service",
        filename: `${DOMAIN}/_services/jira/create-jira-issue.inngest.test.ts`,
        code: `import { createJiraIssue } from "./create-jira-issue.inngest";\nexport const subject = createJiraIssue;\n`,
      },
    ],
    invalid: [
      {
        name: "a durable function minted in a route handler",
        filename: "/repo/apps/web/src/app/api/inngest/route.ts",
        code: `import { inngest } from "@/server/inngest";\nexport const sync = inngest.createFunction({ id: "sync" }, { event: "a/b" }, async () => {});\n`,
        errors: [{ messageId: "creationOutsideInngestFile" }],
      },
      {
        name: "a durable function minted in a feature",
        filename: `${DOMAIN}/_features/jira-panel/jira-panel.tsx`,
        code: `import { inngest } from "@/server/inngest";\nexport const sync = inngest.createFunction({ id: "sync" }, { event: "a/b" }, async () => {});\n`,
        errors: [{ messageId: "creationOutsideInngestFile" }],
      },
      {
        name: "an inngest file at the scope root instead of its services folder",
        filename: `${DOMAIN}/create-jira-issue.inngest.ts`,
        code: `import { inngest } from "@/server/inngest";\nexport const createJiraIssue = inngest.createFunction({ id: "create-jira-issue" }, { event: "a/b" }, async () => {});\n`,
        errors: [{ messageId: "inngestFileOutsideServices" }],
      },
      {
        name: "an inngest file in the helpers bucket",
        filename: `${DOMAIN}/_helpers/jira/retry-jira-issue.inngest.ts`,
        code: `export const retryJiraIssue = null;\n`,
        errors: [{ messageId: "inngestFileOutsideServices" }],
      },
    ],
  },
);
