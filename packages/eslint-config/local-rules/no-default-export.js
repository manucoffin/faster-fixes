export const noDefaultExportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow default exports in feature files — use named exports instead",
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
    },
  },
  create(context) {
    const filename = context.filename;
    const [{ ignorePathPatterns = [] } = {}] = context.options;

    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, messageId: "noDefault" });
      },
    };
  },
};
