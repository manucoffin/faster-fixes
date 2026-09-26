// A `_services/` module is transport-agnostic (ADR-0009 / decision 4, Option B):
// it must be callable from a tRPC procedure, an Inngest job, or a server action
// without an HTTP round-trip, so it must never import the tRPC layer. The
// `trpc-router.ts` at the scope root is the only place that wires tRPC, and it
// imports the services, not the other way around.

const SERVICES_PATH_RE = /(^|\/)_services\//;
const TRPC_IMPORT_RE =
  /^(@\/server\/trpc|@\/lib\/trpc|@trpc\/(server|client))(\/|$)/;

export const servicesNoTrpcImportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files under _services/ may not import the tRPC layer (@/server/trpc, @/lib/trpc, @trpc/*). Services are transport-agnostic.",
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
      servicesImportsTrpc:
        "A `_services/` module must stay transport-agnostic and may not import tRPC (`{{ source }}`). Keep the tRPC wiring in the scope's root `trpc-router.ts` and call this service from there.",
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
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        if (!TRPC_IMPORT_RE.test(source)) return;
        context.report({
          node: node.source,
          messageId: "servicesImportsTrpc",
          data: { source },
        });
      },
    };
  },
};
