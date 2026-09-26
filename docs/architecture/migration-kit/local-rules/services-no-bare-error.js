// A `_services/` module states expected business failures with the DomainError
// vocabulary (ADR-0010), never a bare `Error` or transport-coupled `ActionError`.
// A bare `throw new Error(...)` collapses to HTTP 500: monitoring can't tell a
// user error from a crash and the client can't branch on `error.data.code`.
//
// The rule targets `throw new Error(...)` / `throw new ActionError(...)` only
// (a `NewExpression` argument to `ThrowStatement`). Rethrowing a caught variable
// (`throw err`) stays allowed: the caller decides whether it is a DomainError.

const SERVICES_PATH_RE = /(^|\/)_services\//;
const FORBIDDEN_NAMES = new Set(["Error", "ActionError"]);

export const servicesNoBareErrorRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files under _services/ must throw a DomainError subclass for expected failures, never a bare `Error` or `ActionError`.",
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
      bareError:
        "A `_services/` module must throw a `DomainError` subclass (NotFoundError, ConflictError, BadRequestError, ForbiddenError, PreconditionFailedError) for expected failures, not `new {{ name }}(...)`. See ADR-0010.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    return {
      "ThrowStatement > NewExpression"(node) {
        if (node.callee.type !== "Identifier") return;
        if (!FORBIDDEN_NAMES.has(node.callee.name)) return;
        context.report({
          node,
          messageId: "bareError",
          data: { name: node.callee.name },
        });
      },
    };
  },
};
