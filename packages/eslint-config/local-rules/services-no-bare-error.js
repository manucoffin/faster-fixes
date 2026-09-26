// A `_services/` module states expected business failures with the DomainError
// vocabulary (ADR-0012), never a bare `Error`. A bare `throw new Error(...)`
// collapses to HTTP 500: monitoring can't tell a user error from a crash and
// the client can't branch on `error.data.code`.
//
// The rule targets `throw new Error(...)` only (a `NewExpression` argument to
// `ThrowStatement`). Rethrowing a caught variable (`throw err`) stays allowed:
// the caller decides whether it is a DomainError.

const SERVICES_PATH_RE = /(^|\/)_services\//;

export const servicesNoBareErrorRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files under _services/ must throw a DomainError subclass for expected failures, never a bare `Error`.",
    },
    schema: [],
    messages: {
      bareError:
        "A `_services/` module must throw a `DomainError` subclass (NotFoundError, ConflictError, BadRequestError, ForbiddenError, PreconditionFailedError) for expected failures, not `new Error(...)`. See ADR-0012.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    return {
      "ThrowStatement > NewExpression"(node) {
        if (node.callee.type !== "Identifier") return;
        if (node.callee.name !== "Error") return;
        context.report({ node, messageId: "bareError" });
      },
    };
  },
};
