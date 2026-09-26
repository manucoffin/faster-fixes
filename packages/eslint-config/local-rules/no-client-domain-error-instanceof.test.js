import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noClientDomainErrorInstanceofRule } from "./no-client-domain-error-instanceof.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

const CLIENT_FILE =
  "/repo/apps/web/src/app/_domains/feedback/_features/inbox/inbox.client.tsx";
const SERVER_FILE =
  "/repo/apps/web/src/app/_domains/feedback/_services/get-feedback.ts";

ruleTester.run(
  "no-client-domain-error-instanceof",
  noClientDomainErrorInstanceofRule,
  {
    valid: [
      {
        name: "a service branching on the class it can actually catch",
        filename: SERVER_FILE,
        code: `export function map(error) {\n  return error instanceof DomainError ? error.code : null;\n}\n`,
      },
      {
        name: "a client branching on the transported code",
        filename: CLIENT_FILE,
        code: `export function map(error) {\n  return error.data?.code ?? null;\n}\n`,
      },
      {
        name: "a client testing a plain Error, which does survive locally",
        filename: CLIENT_FILE,
        code: `export function map(error) {\n  return error instanceof Error ? error.message : "";\n}\n`,
      },
      {
        name: "a server module whose name merely contains 'client'",
        filename:
          "/repo/apps/web/src/app/_domains/integration/_services/jira/jira-rest-client.ts",
        code: `export function map(error) {\n  return error instanceof DomainError;\n}\n`,
      },
    ],
    invalid: [
      {
        name: "a `.client.tsx` module",
        filename: CLIENT_FILE,
        code: `export function map(error) {\n  return error instanceof DomainError ? error.message : "";\n}\n`,
        errors: [{ messageId: "clientInstanceofDomainError" }],
      },
      {
        name: "a module carrying a 'use client' directive",
        filename:
          "/repo/apps/web/src/app/_domains/feedback/_features/inbox/use-inbox.ts",
        code: `"use client";\n\nexport function map(error) {\n  return error instanceof DomainError;\n}\n`,
        errors: [{ messageId: "clientInstanceofDomainError" }],
      },
    ],
  },
);
