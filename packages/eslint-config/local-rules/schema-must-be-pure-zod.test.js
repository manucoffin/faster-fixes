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

// The shape the shared config wires: a named exception, written once here so
// the accepted and the rejected case are read against the same list.
const NAMED_EXCEPTION = [
  { allowImportPatterns: ["/_domains/feedback/_types/feedback-status$"] },
];

const SCHEMA = "/repo/apps/web/src/app/_services/invoice.schema.ts";

ruleTester.run("schema-must-be-pure-zod", schemaMustBePureZodRule, {
  valid: [
    {
      name: "a schema importing zod",
      filename: SCHEMA,
      code: `import { z } from "zod";\n`,
    },
    {
      name: "a schema importing a zod subpath entry point",
      filename: SCHEMA,
      code: `import { z } from "zod/v4";\n`,
    },
    {
      name: "a schema importing another schema by relative path",
      filename: SCHEMA,
      code: `import { LineSchema } from "./line.schema";\n`,
    },
    {
      name: "a schema importing a schema that lives under another _services folder",
      filename: SCHEMA,
      code: `import { LineSchema } from "@/app/_domains/billing/_services/line.schema";\n`,
    },
    {
      name: "a schema re-exporting another schema",
      filename: SCHEMA,
      code: `export { LineSchema } from "./line.schema";\n`,
    },
    {
      name: "a schema importing generated Prisma enums",
      filename: SCHEMA,
      code: `import { InvoiceStatus } from "@workspace/db/generated/prisma/enums";\n`,
    },
    {
      name: "a schema importing a module named in the shared config",
      filename: SCHEMA,
      options: NAMED_EXCEPTION,
      code: `import { FeedbackStatusEnum } from "@/app/_domains/feedback/_types/feedback-status";\n`,
    },
    {
      name: "a schema reaching a named exception by relative path",
      filename: SCHEMA,
      options: NAMED_EXCEPTION,
      code: `import { FeedbackStatusEnum } from "../_domains/feedback/_types/feedback-status";\n`,
    },
    {
      name: "a schema with a declaration-level type import of server code",
      filename: SCHEMA,
      code: `import type { Session } from "@/server/auth";\n`,
    },
    {
      name: "a schema with inline type specifiers only on a server import",
      filename: SCHEMA,
      code: `import { type Session } from "@/server/auth";\n`,
    },
    {
      name: "a schema re-exporting a server type",
      filename: SCHEMA,
      code: `export type { Session } from "@/server/auth";\n`,
    },
    {
      name: "a file that is not a schema may import anything",
      filename: "/repo/apps/web/src/app/_services/invoice.service.ts",
      code: `import { prisma } from "@workspace/db";\n`,
    },
  ],
  invalid: [
    {
      name: "a schema importing from @/server/",
      filename: SCHEMA,
      code: `import { auth } from "@/server/auth";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema reaching server code by relative path",
      filename: SCHEMA,
      code: `import { auth } from "../../server/auth";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing the database package root",
      filename: SCHEMA,
      code: `import { prisma } from "@workspace/db";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing the generated Prisma client",
      filename: SCHEMA,
      code: `import { Prisma } from "@workspace/db/generated/prisma/client";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing the Prisma client package",
      filename: SCHEMA,
      code: `import { Prisma } from "@prisma/client";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing a sibling service",
      filename: SCHEMA,
      code: `import { getInvoice } from "./invoice.service";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema star-re-exporting a sibling service",
      filename: SCHEMA,
      code: `export * from "./invoice.service";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema dynamically importing server code",
      filename: SCHEMA,
      code: `const load = () => import("@/server/auth");\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema re-exporting the database package",
      filename: SCHEMA,
      code: `export { prisma } from "@workspace/db";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      // The denylist accepted every specifier it had not been taught: a pure
      // helper, an npm package and a React hook all passed.
      name: "a schema importing an unrelated package",
      filename: SCHEMA,
      code: `import { format } from "date-fns";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing a helper that is not on the list",
      filename: SCHEMA,
      code: `import { formatAmount } from "./format";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
    {
      name: "a schema importing a module the shared config does not name",
      filename: SCHEMA,
      options: NAMED_EXCEPTION,
      code: `import { PlanName } from "@/app/_domains/subscription";\n`,
      errors: [{ messageId: "importNotAllowed" }],
    },
  ],
});
