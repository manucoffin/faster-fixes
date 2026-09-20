export const noDefaultExportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow default exports in feature files — use named exports instead",
    },
    schema: [],
    messages: {
      noDefault:
        "Use a named export (`export function Foo` / `export const foo`) instead of `export default`. Default exports make refactoring harder and are not allowed in this project.",
    },
  },
  create(context) {
    const filename = context.filename;

    return {
      ExportDefaultDeclaration(node) {
        context.report({ node, messageId: "noDefault" });
      },
    };
  },
};
