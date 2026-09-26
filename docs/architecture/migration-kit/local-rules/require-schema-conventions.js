const SCHEMA_FILE_RE = /\.schema\.ts$/;
const UPPER_SNAKE_CASE_RE = /^[A-Z][A-Z0-9_]*$/;
// A retired schema is an empty `_deprecated_*` stub by repo convention, so it
// has no exports left to name.
const DEPRECATED_FILE_RE = /(^|[/\\])_deprecated_/;

export const requireSchemaConventionsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce naming conventions in .schema.ts files: exported const must end with 'Schema', exported type must end with 'Input', 'Inputs' or 'Values'. Optionally require PascalCase schema consts and the singular 'Input' suffix.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePathPatterns: {
            type: "array",
            items: { type: "string" },
          },
          // When true, an exported `*Schema` const must be PascalCase
          // (start with an uppercase letter): `PrestationSchema`, not
          // `prestationSchema`.
          requirePascalCaseSchema: { type: "boolean" },
          // When true, an exported input type must use the singular `Input`
          // suffix: `CreateInvoiceInput`, never the plural `Inputs`.
          requireSingularInput: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingSchemaSuffix:
        "Exported const `{{ name }}` in a .schema.ts file must end with `Schema` (e.g. `{{ name }}Schema`).",
      missingInputSuffix:
        "Exported type `{{ name }}` in a .schema.ts file must end with `Input` (e.g. `{{ name }}Input`), or with `Values` for the pre-parse form values type (`z.input<typeof {{ name }}Schema>`).",
      schemaNotPascalCase:
        "Exported schema `{{ name }}` must be PascalCase, i.e. start with an uppercase letter (e.g. `{{ pascalName }}`).",
      pluralInputSuffix:
        "Exported type `{{ name }}` must use the singular `Input` suffix, not plural `Inputs` (e.g. `{{ singularName }}`).",
      noExportedSchema:
        "This .schema.ts file must export at least one const ending with `Schema`.",
      noExportedInput:
        "This .schema.ts file must export at least one type ending with `Input` (or `Inputs`).",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!SCHEMA_FILE_RE.test(filename) || DEPRECATED_FILE_RE.test(filename)) {
      return {};
    }

    const [
      {
        ignorePathPatterns = [],
        requirePascalCaseSchema = false,
        requireSingularInput = false,
      } = {},
    ] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    let hasSchemaExport = false;
    let hasInputExport = false;

    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (!declaration) return;

        // Check exported const (VariableDeclaration)
        if (declaration.type === "VariableDeclaration") {
          for (const declarator of declaration.declarations) {
            if (declarator.id && declarator.id.type === "Identifier") {
              const name = declarator.id.name;
              if (name.endsWith("Schema")) {
                hasSchemaExport = true;
                if (requirePascalCaseSchema && !/^[A-Z]/.test(name)) {
                  context.report({
                    node: declarator.id,
                    messageId: "schemaNotPascalCase",
                    data: {
                      name,
                      pascalName: name.charAt(0).toUpperCase() + name.slice(1),
                    },
                  });
                }
              } else if (UPPER_SNAKE_CASE_RE.test(name)) {
                // Skip UPPER_CASE constants (config values, limits, etc.)
              } else {
                context.report({
                  node: declarator.id,
                  messageId: "missingSchemaSuffix",
                  data: { name },
                });
              }
            }
          }
        }

        // Check exported type alias (TSTypeAliasDeclaration)
        if (declaration.type === "TSTypeAliasDeclaration") {
          const name = declaration.id.name;
          if (name.endsWith("Inputs")) {
            // Still an input type, just misnamed (plural). Counts toward the
            // file-level "has an input export" check either way.
            hasInputExport = true;
            if (requireSingularInput) {
              context.report({
                node: declaration.id,
                messageId: "pluralInputSuffix",
                data: { name, singularName: name.slice(0, -1) },
              });
            }
          } else if (name.endsWith("Input")) {
            hasInputExport = true;
          } else if (name.endsWith("Values")) {
            // The pre-parse companion of the `Input` type: `z.input<typeof S>`,
            // which a form resolver needs when the schema has `.default()` or a
            // coercion. It never satisfies the required `Input` export on its
            // own, so `hasInputExport` deliberately stays untouched.
          } else {
            context.report({
              node: declaration.id,
              messageId: "missingInputSuffix",
              data: { name },
            });
          }
        }
      },
      "Program:exit"(node) {
        if (!hasSchemaExport) {
          context.report({ node, messageId: "noExportedSchema" });
        }
        if (!hasInputExport) {
          context.report({ node, messageId: "noExportedInput" });
        }
      },
    };
  },
};
