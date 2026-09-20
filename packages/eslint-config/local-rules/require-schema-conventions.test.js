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

ruleTester.run("require-schema-conventions", requireSchemaConventionsRule, {
  valid: [
    {
      name: "a file that is not a schema",
      filename: "/repo/apps/web/src/app/_services/invoice.service.ts",
      code: `export const anything = 1;\nexport type Whatever = string;\n`,
    },
    {
      name: "a schema exporting a Schema const and an Input type",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: wellNamedSchema,
    },
    {
      name: "a schema also exporting the pre-parse Values type",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `${wellNamedSchema}export type InvoiceValues = z.input<typeof InvoiceSchema>;\n`,
    },
    {
      name: "an UPPER_SNAKE_CASE constant alongside the schema",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `${wellNamedSchema}export const MAX_LINES = 50;\n`,
    },
    {
      name: "a plural Inputs type while requireSingularInput is off",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({});
export type InvoiceInputs = z.infer<typeof InvoiceSchema>;
`,
    },
    {
      name: "a PascalCase schema const while requirePascalCaseSchema is on",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: wellNamedSchema,
      options: [{ requirePascalCaseSchema: true }],
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
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `${wellNamedSchema}export const invoiceDefaults = {};\n`,
      errors: [{ messageId: "missingSchemaSuffix" }],
    },
    {
      name: "an exported type that does not end with Input, Inputs or Values",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `${wellNamedSchema}export type InvoicePayload = { amount: number };\n`,
      errors: [{ messageId: "missingInputSuffix" }],
    },
    {
      name: "a schema file exporting neither a Schema const nor an Input type",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `export {};\n`,
      errors: [
        { messageId: "noExportedSchema" },
        { messageId: "noExportedInput" },
      ],
    },
    {
      name: "a camelCase schema const while requirePascalCaseSchema is on",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { z } from "zod";
export const invoiceSchema = z.object({});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
`,
      options: [{ requirePascalCaseSchema: true }],
      errors: [{ messageId: "schemaNotPascalCase" }],
    },
    {
      name: "a plural Inputs type while requireSingularInput is on",
      filename: "/repo/apps/web/src/app/_services/invoice.schema.ts",
      code: `import { z } from "zod";
export const InvoiceSchema = z.object({});
export type InvoiceInputs = z.infer<typeof InvoiceSchema>;
`,
      options: [{ requireSingularInput: true }],
      errors: [{ messageId: "pluralInputSuffix" }],
    },
  ],
});
