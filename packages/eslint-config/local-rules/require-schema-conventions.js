const SCHEMA_FILE_RE = /\.schema\.ts$/;
const UPPER_SNAKE_CASE_RE = /^[A-Z][A-Z0-9_]*$/;

export const requireSchemaConventionsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce naming conventions in .schema.ts files: exported const must end with 'Schema', exported type must end with 'Input' or 'Inputs'",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingSchemaSuffix:
        "Exported const `{{ name }}` in a .schema.ts file must end with `Schema` (e.g. `{{ name }}Schema`).",
      missingInputSuffix:
        "Exported type `{{ name }}` in a .schema.ts file must end with `Input` (e.g. `{{ name }}Input`).",
      noExportedSchema:
        "This .schema.ts file must export at least one const ending with `Schema`.",
      noExportedInput:
        "This .schema.ts file must export at least one type ending with `Input` (or `Inputs`).",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!SCHEMA_FILE_RE.test(filename)) {
      return {};
    }

    const [{ ignorePathPatterns = [] } = {}] = context.options;
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
          if (name.endsWith("Input") || name.endsWith("Inputs")) {
            hasInputExport = true;
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
