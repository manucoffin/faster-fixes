import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noCrossLayerImportRule } from "./no-cross-layer-import.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const BARREL = "/repo/apps/web/src/app/_domains/billing/index.ts";
const ROUTER = "/repo/apps/web/src/app/(authenticated)/trpc-router.ts";
const SERVICE = "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts";
const FEATURE =
  "/repo/apps/web/src/app/(authenticated)/_features/plan-card.tsx";

// The shape the shared config declares: a narrow row first, a broad one after,
// each with its own message and allowlist.
const ROWS = [
  {
    rows: [
      {
        name: "a domain barrel exports capabilities, not server implementations",
        sourcePathPattern: "/src/app/_domains/[^/]+/index\\.ts$",
        forbiddenPatterns: ["/_services/", "(^|/)trpc-router$"],
        runtimeOnly: true,
        message: "A domain barrel exposes UI, schemas, types and pure helpers.",
      },
      {
        name: "a tRPC router is thin transport, not a query",
        sourcePathPattern: "(^|/)trpc-router\\.ts$",
        forbiddenPatterns: ["^@workspace/db(/|$)"],
        message: "A tRPC router validates input and calls a service.",
      },
      {
        name: "database access lives in a services folder or the server folder",
        sourcePathPattern: "/src/",
        exemptPathPatterns: ["/_services/", "/src/server/"],
        forbiddenPatterns: ["^@workspace/db(/|$)"],
        runtimeOnly: true,
        message: "Database access lives in a `_services/` module.",
        allowImportPatterns: ["^@workspace/db/seed-fixtures$"],
      },
    ],
  },
];

ruleTester.run("no-cross-layer-import", noCrossLayerImportRule, {
  valid: [
    {
      name: "a file no row's source pattern matches",
      filename: "/repo/packages/ui/src/components/button.tsx",
      code: `import { prisma } from "@workspace/db";\n`,
      options: [{ rows: [] }],
    },
    {
      name: "a barrel re-exporting a helper and a type",
      filename: BARREL,
      code: `export { formatPlan } from "./_helpers/format-plan";\nexport type { Plan } from "./_types/plan";\n`,
      options: ROWS,
    },
    {
      name: "a barrel re-exporting a service's output type, which is how a service publishes one",
      filename: BARREL,
      code: `export type { GetPlanOutput } from "./_services/get-plan";\n`,
      options: ROWS,
    },
    {
      name: "a service importing the database, which its row exempts by path",
      filename: SERVICE,
      code: `import { prisma } from "@workspace/db";\nexport async function getPlan() {}\n`,
      options: ROWS,
    },
    {
      name: "a server folder module importing the database",
      filename: "/repo/apps/web/src/server/auth/index.ts",
      code: `import { prisma } from "@workspace/db";\n`,
      options: ROWS,
    },
    {
      name: "a feature type-importing a Prisma row type, which reaches no runtime",
      filename: FEATURE,
      code: `import type { Plan } from "@workspace/db";\n`,
      options: ROWS,
    },
    {
      name: "a feature importing the specifier its row's allowlist names",
      filename: FEATURE,
      code: `import { seedPlan } from "@workspace/db/seed-fixtures";\n`,
      options: ROWS,
    },
    {
      name: "a router importing its own scope's service",
      filename: ROUTER,
      code: `import { getPlan } from "./_services/get-plan";\n`,
      options: ROWS,
    },
  ],
  invalid: [
    {
      name: "a barrel re-exporting a service",
      filename: BARREL,
      code: `export { getPlan } from "./_services/get-plan";\n`,
      options: ROWS,
      errors: [
        {
          messageId: "forbiddenLayerImport",
          data: {
            message:
              "A domain barrel exposes UI, schemas, types and pure helpers.",
            source: "./_services/get-plan",
          },
        },
      ],
    },
    {
      name: "a barrel re-exporting its router",
      filename: BARREL,
      code: `export { billingRouter } from "./trpc-router";\n`,
      options: ROWS,
      errors: [{ messageId: "forbiddenLayerImport" }],
    },
    {
      name: "a barrel star-exporting a service folder",
      filename: BARREL,
      code: `export * from "./_services/get-plan";\n`,
      options: ROWS,
      errors: [{ messageId: "forbiddenLayerImport" }],
    },
    {
      name: "a router importing the database, reported with the router row's message",
      filename: ROUTER,
      code: `import { prisma } from "@workspace/db";\n`,
      options: ROWS,
      errors: [
        {
          messageId: "forbiddenLayerImport",
          data: {
            message: "A tRPC router validates input and calls a service.",
            source: "@workspace/db",
          },
        },
      ],
    },
    {
      name: "a router type-importing the database, which its row judges whatever the kind",
      filename: ROUTER,
      code: `import type { Prisma } from "@workspace/db";\n`,
      options: ROWS,
      errors: [{ messageId: "forbiddenLayerImport" }],
    },
    {
      name: "a feature importing the database",
      filename: FEATURE,
      code: `import { prisma } from "@workspace/db";\n`,
      options: ROWS,
      errors: [
        {
          messageId: "forbiddenLayerImport",
          data: {
            message: "Database access lives in a `_services/` module.",
            source: "@workspace/db",
          },
        },
      ],
    },
    {
      name: "a feature reaching the database through a dynamic import",
      filename: FEATURE,
      code: `export const load = () => import("@workspace/db");\n`,
      options: ROWS,
      errors: [{ messageId: "forbiddenLayerImport" }],
    },
    {
      name: "a feature reaching a service's database import through a relative path",
      filename: FEATURE,
      code: `import { prisma } from "../../../server/db";\n`,
      options: [
        {
          rows: [
            {
              name: "the server folder is not reachable by relative path",
              sourcePathPattern: "/_features/",
              forbiddenPatterns: ["/src/server/"],
              message: "Import the server folder by its alias.",
            },
          ],
        },
      ],
      errors: [{ messageId: "forbiddenLayerImport" }],
    },
    {
      name: "a file reported once, by the first row that matches",
      filename: ROUTER,
      code: `import { prisma } from "@workspace/db";\nimport { other } from "@workspace/db";\n`,
      options: ROWS,
      errors: [
        { messageId: "forbiddenLayerImport" },
        { messageId: "forbiddenLayerImport" },
      ],
    },
  ],
});
