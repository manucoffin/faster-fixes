import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { servicesNoTrpcImportRule } from "./services-no-trpc-import.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("services-no-trpc-import", servicesNoTrpcImportRule, {
  valid: [
    {
      name: "a service re-exporting a sibling module",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export { formatPlan } from "./format-plan";\n`,
    },
    {
      name: "a service importing the database",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { db } from "@/server/db";\nexport function getPlan() {}\n`,
    },
    {
      name: "a package whose name only starts like the tRPC scope",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { x } from "@trpc-community/helpers";\nexport function getPlan() {}\n`,
    },
    {
      name: "a module whose path only starts like the tRPC folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { x } from "@/server/trpc-helpers";\nexport function getPlan() {}\n`,
    },
    {
      name: "the tRPC router outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/trpc-router.ts",
      code: `import { router } from "@/server/trpc";\nexport const billingRouter = router({});\n`,
    },
  ],
  invalid: [
    {
      name: "a service re-exporting the tRPC layer",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export { router } from "@/server/trpc";\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "a service star-re-exporting the tRPC server package",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `export * from "@trpc/server";\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "a service dynamically importing the tRPC layer",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `const load = () => import("@/server/trpc");\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "a service reaching the tRPC layer by relative path",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { router } from "../../../../server/trpc";\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "the server tRPC folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { router } from "@/server/trpc";\nexport function getPlan() {}\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "a deep import into the client tRPC folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { client } from "@/lib/trpc/client";\nexport function getPlan() {}\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
    {
      name: "the @trpc/server package",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { TRPCError } from "@trpc/server";\nexport function getPlan() {}\n`,
      errors: [{ messageId: "servicesImportsTrpc" }],
    },
  ],
});
