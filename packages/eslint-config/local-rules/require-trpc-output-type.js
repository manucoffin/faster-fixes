const TRPC_PROCEDURE_FILE_RE = /\.trpc\.(query|mutation)\.tsx?$/;

function isInferProcedureOutputTypeAlias(node) {
  if (
    node.type !== "ExportNamedDeclaration" ||
    !node.declaration ||
    node.declaration.type !== "TSTypeAliasDeclaration"
  ) {
    return false;
  }

  const typeAnnotation = node.declaration.typeAnnotation;
  if (!typeAnnotation || typeAnnotation.type !== "TSTypeReference") {
    return false;
  }

  return (
    typeAnnotation.typeName.type === "Identifier" &&
    typeAnnotation.typeName.name === "inferProcedureOutput"
  );
}

export const requireTrpcOutputTypeRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported inferProcedureOutput type alias in .trpc.query/.trpc.mutation files",
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
      missing:
        "This tRPC file must export a type alias based on inferProcedureOutput (e.g. `export type GetUserOutput = inferProcedureOutput<typeof getUser>;`).",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!TRPC_PROCEDURE_FILE_RE.test(filename)) {
      return {};
    }

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))) {
      return {};
    }

    let hasOutputTypeAlias = false;

    return {
      ExportNamedDeclaration(node) {
        if (isInferProcedureOutputTypeAlias(node)) {
          hasOutputTypeAlias = true;
        }
      },
      "Program:exit"(node) {
        if (!hasOutputTypeAlias) {
          context.report({ node, messageId: "missing" });
        }
      },
    };
  },
};
