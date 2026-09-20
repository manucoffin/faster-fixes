import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { requireSchemaConventionsRule } from "./require-schema-conventions.js";

RuleTester.describe = describe;
RuleTester.it = it;

// The rule reads TypeScript type aliases, so the TS parser is required.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const wellNamedSchema = `import { z } from "zod";
export const InvoiceSchema = z.object({ amount: z.number() });
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
`;

const schemaPath = "/repo/apps/web/src/app/_services/invoice.schema.ts";

ruleTester.run("require-schema-conventions", requireSchemaConventionsRule, {
  valid: [
    {
      name: "a file that is not a schema",
      filename: "/repo/apps/web/src/app/_services/invoice.service.ts",
      code: `export const anything = 1;\nexport type Whatever = string;\n`,
    },
    {
      name: "a schema exporting a Schema const and an Input type",
      filename: schemaPath,
      code: wellNamedSchema,
    },
    {
      name: "a schema also exporting the pre-parse Values type",
      filename: schemaPath,
      code: `${wellNamedSchema}export type InvoiceValues = z.input<typeof InvoiceSchema>;\n`,
    },
    {
      name: "an Input type inferred from a private schema of the same file",
      filename: schemaPath,
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({ lines: z.array(LineSchema) });
const LineSchema = z.object({ amount: z.number() });
export type InvoiceLineInput = z.infer<typeof LineSchema>;
`,
    },
    {
      name: "a shared fragment exporting no Input type",
      filename: schemaPath,
      code: `import { z } from "zod";
export const InvoiceFieldsSchema = z.object({ amount: z.number() });
`,
    },
    {
      name: "a non-input type keeping its real name",
      filename: schemaPath,
      code: `${wellNamedSchema}export type InvoiceApiResponse = { ok: boolean };\n`,
    },
    {
      name: "an UPPER_SNAKE_CASE constant alongside the schema",
      filename: schemaPath,
      code: `${wellNamedSchema}export const MAX_LINES = 50;\n`,
    },
    {
      name: "a Schema const published by a separate export statement",
      filename: schemaPath,
      code: `import { z } from "zod";
const InvoiceSchema = z.object({});
type InvoiceInput = z.infer<typeof InvoiceSchema>;
export { InvoiceSchema };
export type { InvoiceInput };
`,
    },
    {
      name: "a plural Inputs type while requireSingularInput is off",
      filename: schemaPath,
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({});
export type InvoiceInputs = z.infer<typeof InvoiceSchema>;
`,
    },
    {
      name: "a PascalCase schema const while requirePascalCaseSchema is on",
      filename: schemaPath,
      code: wellNamedSchema,
      options: [{ requirePascalCaseSchema: true }],
    },
    {
      name: "a schema composed with extend rather than merge",
      filename: schemaPath,
      code: `${wellNamedSchema}export const PaidInvoiceSchema = InvoiceSchema.extend({ paidAt: z.date() });\n`,
    },
    {
      name: "a Prisma enum read through z.enum",
      filename: schemaPath,
      code: `import { z } from "zod";
import { InvoiceStatus } from "@workspace/db/generated/prisma/enums";
export const InvoiceSchema = z.object({ status: z.enum(InvoiceStatus) });
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
`,
    },
    {
      name: "a retired _deprecated_ schema stub with no exports",
      filename:
        "/repo/apps/web/src/app/_services/_deprecated_invoice.schema.ts",
      code: `// Retired, kept as an empty stub.\n`,
    },
  ],
  invalid: [
    {
      name: "an exported const that does not end with Schema",
      filename: schemaPath,
      code: `${wellNamedSchema}export const invoiceDefaults = {};\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "a value published by a separate export statement",
      filename: schemaPath,
      code: `${wellNamedSchema}const invoiceDefaults = {};\nexport { invoiceDefaults };\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "a re-exported binding that does not end with Schema",
      filename: schemaPath,
      code: `import { InvoiceStatusEnum } from "@/app/_domains/invoice/_types/invoice-status";\n${wellNamedSchema}export { InvoiceStatusEnum };\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "an exported function",
      filename: schemaPath,
      code: `${wellNamedSchema}export function buildInvoice() {\n  return {};\n}\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "an exported enum",
      filename: schemaPath,
      code: `${wellNamedSchema}export enum InvoiceStatus {\n  Draft = "draft",\n}\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "an exported interface claiming the Input suffix",
      filename: schemaPath,
      code: `${wellNamedSchema}export interface InvoiceLineInput {\n  amount: number;\n}\n`,
      errors: [{ messageId: "notInferredFromSchema" }],
    },
    {
      name: "an Input type that is not inferred from a schema",
      filename: schemaPath,
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({});
export type InvoiceInput = { amount: number };
`,
      errors: [{ messageId: "notInferredFromSchema" }],
    },
    {
      name: "an Input type inferred from a schema of another file",
      filename: schemaPath,
      code: `import { z } from "zod";
import { LineSchema } from "./line.schema";
export const InvoiceSchema = z.object({});
export type InvoiceLineInput = z.infer<typeof LineSchema>;
`,
      errors: [{ messageId: "notInferredFromSchema" }],
    },
    {
      name: "a Values type built with z.infer instead of z.input",
      filename: schemaPath,
      code: `${wellNamedSchema}export type InvoiceValues = z.infer<typeof InvoiceSchema>;\n`,
      errors: [{ messageId: "notInferredFromSchema" }],
    },
    {
      name: "a schema file exporting no Schema const",
      filename: schemaPath,
      code: `export {};\n`,
      errors: [{ messageId: "noExportedSchema" }],
    },
    {
      name: "a camelCase schema const while requirePascalCaseSchema is on",
      filename: schemaPath,
      code: `import { z } from "zod";
export const invoiceSchema = z.object({});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
`,
      options: [{ requirePascalCaseSchema: true }],
      errors: [{ messageId: "schemaNotPascalCase" }],
    },
    {
      name: "a plural Inputs type while requireSingularInput is on",
      filename: schemaPath,
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({});
export type InvoiceInputs = z.infer<typeof InvoiceSchema>;
`,
      options: [{ requireSingularInput: true }],
      errors: [{ messageId: "pluralInputSuffix" }],
    },
    {
      name: "a Prisma enum read through the deprecated z.nativeEnum",
      filename: schemaPath,
      code: `import { z } from "zod";
import { InvoiceStatus } from "@workspace/db/generated/prisma/enums";
export const InvoiceSchema = z.object({ status: z.nativeEnum(InvoiceStatus) });
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
`,
      errors: [{ messageId: "nativeEnumDeprecated" }],
    },
    {
      name: "two schemas composed with the deprecated merge",
      filename: schemaPath,
      code: `${wellNamedSchema}export const PaidInvoiceSchema = InvoiceSchema.merge(PaymentSchema);\nexport const PaymentSchema = z.object({});\n`,
      errors: [{ messageId: "mergeDeprecated" }],
    },
  ],
});
