import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { typesFolderTypeOnlyRule } from "./types-folder-type-only.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tseslint.parser,
  },
});

const FILENAME = "/repo/apps/web/src/app/_domains/feedback/_types/thing.ts";

ruleTester.run("types-folder-type-only", typesFolderTypeOnlyRule, {
  valid: [
    {
      name: "type aliases and a type import",
      filename: FILENAME,
      code: `import type { Other } from "./other";\nexport type Thing = { other: Other };\ntype Local = string;\nexport type Both = Thing | Local;\n`,
    },
    {
      name: "a type derived from a helper constant through a type import",
      filename: FILENAME,
      code: `import type { PLAN_LIMITS } from "../_helpers/plans";\nexport type PlanLimits = (typeof PLAN_LIMITS)["free"];\n`,
    },
    {
      name: "an interface",
      filename: FILENAME,
      code: `export interface Thing { id: string }\n`,
    },
    {
      name: "a type re-export",
      filename: FILENAME,
      code: `export type { Thing } from "./thing-source";\nexport type * from "./more";\n`,
    },
    {
      name: "a re-export whose specifiers are all type-only",
      filename: FILENAME,
      code: `export { type Thing } from "./thing-source";\n`,
    },
    {
      name: "a local export list of types",
      filename: FILENAME,
      code: `type Thing = string;\nexport { Thing };\n`,
    },
    {
      name: "ambient declarations",
      filename: FILENAME,
      code: `declare module "lib" { export type X = string; }\ndeclare global { interface Window { x: string } }\nexport declare const VERSION: string;\n`,
    },
    {
      name: "a route-level types folder",
      filename: "/repo/apps/web/src/app/(authenticated)/inbox/_types/row.ts",
      code: `export type Row = { id: string };\n`,
    },
    {
      name: "a retired file holding only a comment",
      filename:
        "/repo/apps/web/src/app/_domains/feedback/_types/_deprecated_thing.ts",
      code: `// Retired: moved to ../_helpers/thing.ts\n`,
    },
    {
      name: "runtime code outside a types folder",
      filename: "/repo/apps/web/src/app/_domains/feedback/_helpers/status.ts",
      code: `export const STATUSES = ["new", "closed"];\n`,
    },
    {
      name: "a file merely named after types",
      filename: "/repo/apps/web/src/app/_domains/feedback/_types.ts",
      code: `export const STATUSES = ["new", "closed"];\n`,
    },
  ],
  invalid: [
    {
      name: "an exported Zod enum",
      filename: FILENAME,
      code: `import { z } from "zod";\nexport const StatusEnum = z.enum(["new", "closed"]);\nexport type Status = z.infer<typeof StatusEnum>;\n`,
      errors: [{ messageId: "runtimeInTypes", line: 2 }],
    },
    {
      name: "an exported constant",
      filename: FILENAME,
      code: `export const DEFAULT_THING = { id: "a" };\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "an exported function",
      filename: FILENAME,
      code: `export function getThing() { return 1; }\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a private function",
      filename: FILENAME,
      code: `function toRadians(d) { return d; }\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "an enum",
      filename: FILENAME,
      code: `export enum Status { A = "a" }\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a side-effect import",
      filename: FILENAME,
      code: `import "./polyfill";\nexport type Thing = string;\n`,
      errors: [{ messageId: "runtimeInTypes", line: 1 }],
    },
    {
      name: "a value re-export",
      filename: FILENAME,
      code: `export { getThing } from "./get-thing";\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a re-export mixing a value and a type",
      filename: FILENAME,
      code: `export { type Thing, getThing } from "./get-thing";\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a value star re-export",
      filename: FILENAME,
      code: `export * from "./get-thing";\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a default export",
      filename: FILENAME,
      code: `export default {};\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
    {
      name: "a nested file of a types folder",
      filename:
        "/repo/apps/web/src/app/_domains/integration/_types/tracker/outcome.ts",
      code: `export const OUTCOMES = ["accepted"];\n`,
      errors: [{ messageId: "runtimeInTypes" }],
    },
  ],
});
