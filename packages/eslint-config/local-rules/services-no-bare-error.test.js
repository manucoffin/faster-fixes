import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { servicesNoBareErrorRule } from "./services-no-bare-error.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("services-no-bare-error", servicesNoBareErrorRule, {
  valid: [
    {
      name: "a domain error subclass",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export function getPlan() {\n  throw new NotFoundError("plan");\n}\n`,
    },
    {
      name: "rethrowing a caught value",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export function getPlan() {\n  try {\n    return 1;\n  } catch (error) {\n    throw error;\n  }\n}\n`,
    },
    {
      name: "constructing an Error without throwing it",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export function getPlan() {\n  const cause = new Error("upstream");\n  return cause;\n}\n`,
    },
    {
      name: "a bare Error outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/trpc-router.ts",
      code: `export function getPlan() {\n  throw new Error("boom");\n}\n`,
    },
  ],
  invalid: [
    {
      name: "a bare Error",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export function getPlan() {\n  throw new Error("boom");\n}\n`,
      errors: [{ messageId: "bareError" }],
    },
  ],
});
