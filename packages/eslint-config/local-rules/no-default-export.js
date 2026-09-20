import { filenameOf } from "./imports.js";

/** The exported name, whether it is written bare, aliased or quoted. */
function exportedNameOf(specifier) {
  const exported = specifier.exported;
  if (!exported) return null;
  return exported.type === "Identifier" ? exported.name : exported.value;
}

export const noDefaultExportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow default exports across the web app source: use named exports instead",
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
      noDefault:
        "Use a named export (`export function Foo` / `export const foo`) instead of `export default`. Default exports make refactoring harder and are not allowed in this project.",
      aliasedDefault:
        "`export { Foo as default }` mints a default export just as `export default` does. Export the binding under its own name instead.",
    },
  },
  create(context) {
    const [{ ignorePathPatterns = [] } = {}] = context.options;
    const filename = filenameOf(context);

    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, messageId: "noDefault" });
      },
      ExportNamedDeclaration(node) {
        // `export { default as Chart } from "chart-lib"` reads a default and
        // publishes a name, which is the sanctioned way to consume one. Only
        // the reverse direction mints a default here.
        for (const specifier of node.specifiers ?? []) {
          if (exportedNameOf(specifier) === "default") {
            context.report({ node: specifier, messageId: "aliasedDefault" });
          }
        }
      },
    };
  },
};
