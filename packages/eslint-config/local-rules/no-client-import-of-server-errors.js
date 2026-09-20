// A client module (`'use client'` directive or `*.client.tsx` filename) must not
// import `@/server/errors/*` (ADR-0012, domain errors). `instanceof DomainError`
// does not
// survive serialization across the network boundary, so a client checking it
// would silently never match. Client code branches on `error.data.code`
// instead. The DomainError classes also pull server-only code into the bundle.

const SERVER_ERRORS_IMPORT_RE = /^@\/server\/errors(\/|$)/;
const CLIENT_SUFFIX_RE = /\.client\.tsx?$/;
const USE_CLIENT_RE = /^['"]use client['"]/;

export const noClientImportOfServerErrorsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules ('use client' / *.client.tsx) may not import @/server/errors/* (instanceof does not survive serialization; branch on error.data.code).",
    },
    schema: [],
    messages: {
      clientImportsServerErrors:
        "Client modules may not import `@/server/errors/*` (`instanceof DomainError` does not survive serialization). Branch on `error.data.code` instead. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    let isClient = CLIENT_SUFFIX_RE.test(filename);

    return {
      Program(node) {
        const firstStatement = node.body[0];
        if (
          firstStatement &&
          firstStatement.type === "ExpressionStatement" &&
          firstStatement.expression.type === "Literal" &&
          typeof firstStatement.expression.raw === "string" &&
          USE_CLIENT_RE.test(firstStatement.expression.raw)
        ) {
          isClient = true;
        }
      },
      ImportDeclaration(node) {
        if (!isClient) return;
        const source = node.source.value;
        if (typeof source !== "string") return;
        if (!SERVER_ERRORS_IMPORT_RE.test(source)) return;
        context.report({
          node: node.source,
          messageId: "clientImportsServerErrors",
          data: { source },
        });
      },
    };
  },
};
