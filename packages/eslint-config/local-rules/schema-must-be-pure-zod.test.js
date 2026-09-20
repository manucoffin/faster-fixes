import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { schemaMustBePureZodRule } from "./schema-must-be-pure-zod.js";

RuleTester.describe = describe;
RuleTester.it = it;

// `importKind` on an import declaration only exists under the TS parser.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

ruleTester.run("schema-must-be-pure-zod", schemaMustBePureZodRule, {
  valid: [
    {
      name: "a schema with inline type specifiers only on a server import",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { type Session } from "@/server/auth";\n`,
    },
    {
      name: "a schema re-exporting a server type",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `export type { Session } from "@/server/auth";\n`,
    },
    {
      name: "a schema re-exporting another schema",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `export { LineSchema } from "./line.schema";\n`,
    },
    {
      name: "a file that is not a schema may import server code",
      filename: "/repo/apps/web/src/app/_services/invoice.service.ts",
      code: `import { prisma } from "@workspace/db";\n`,
    },
    {
      name: "a schema importing zod",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { z } from "zod";\n`,
    },
    {
      name: "a schema importing another schema by relative path",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { LineSchema } from "./line.schema";\n`,
    },
    {
      name: "a schema importing a schema that lives under another _services folder",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { LineSchema } from "@/app/_domains/billing/_services/line.schema";\n`,
    },
    {
      name: "a schema importing generated Prisma enums",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { InvoiceStatus } from "@workspace/db/generated/prisma/enums";\n`,
    },
    {
      name: "a schema with a type-only import of server code",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import type { Session } from "@/server/auth";\n`,
    },
    {
      name: "a schema outside _services importing a same-directory helper",
      filename: "/repo/apps/web/src/app/_helpers/invoice.schema.ts",
      code: `import { formatAmount } from "./format";\n`,
    },
  ],
  invalid: [
    {
      name: "a schema re-exporting the database package",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `export { prisma } from "@workspace/db";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema star-re-exporting a sibling service",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `export * from "./invoice.service";\n`,
      errors: [{ messageId: "siblingService" }],
    },
    {
      name: "a schema dynamically importing server code",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `const load = () => import("@/server/auth");\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema reaching server code by relative path",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { auth } from "../../server/auth";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema importing from @/server/",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { auth } from "@/server/auth";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema importing the Prisma client package",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { Prisma } from "@prisma/client";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema importing the database package root",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { prisma } from "@workspace/db";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema importing the database package through its /index entrypoint",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { prisma } from "@workspace/db/index";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema importing the generated Prisma client",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { Prisma } from "@workspace/db/generated/prisma/client";\n`,
      errors: [{ messageId: "serverImport" }],
    },
    {
      name: "a schema deep-importing a non-schema service module",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { getInvoice } from "@/app/_domains/billing/_services/invoice.service";\n`,
      errors: [{ messageId: "siblingService" }],
    },
    {
      name: "a schema inside _services importing a same-directory sibling",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { getInvoice } from "./invoice.service";\n`,
      errors: [{ messageId: "siblingService" }],
    },
  ],
});
