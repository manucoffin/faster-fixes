// A `*.schema.ts` must stay pure-Zod with no server-only imports (ADR-0009 /
// decision 12 guardrail). Schemas live in `_services/` but are shared with the
// client form resolver; the bundler resolves per-file, so a schema that pulls in
// `@/server/`, Prisma, or a sibling (non-schema) service would drag server-only
// code into the client bundle. Allowed: `zod`, other `*.schema` files, and pure
// helpers/types.

const SCHEMA_FILE_RE = /\.schema\.ts$/;
const SCHEMA_IMPORT_RE = /\.schema(\.[jt]sx?)?$/;
const SERVICES_PATH_RE = /(^|\/)_services\//;
const SERVICES_IMPORT_RE = /(^|\/)_services\//;
const SAME_DIR_IMPORT_RE = /^\.\/[^/]+$/;

// Server-only import sources a pure schema must never reach for.
const SERVER_IMPORT_RE = /^@\/server\//;
// Only the Prisma *client* (server runtime) is forbidden. Generated enums/types
// (`@repo/db/generated/prisma/enums`) are pure value/type objects, client-safe,
// and are the standard `z.nativeEnum(...)` source, so they are allowed.
const PRISMA_IMPORT_RE =
  /^(@prisma\/client(\/|$)|@repo\/db$|@repo\/db\/generated\/prisma\/client(\/|$))/;

export const schemaMustBePureZodRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A *.schema.ts must stay pure-Zod: no @/server/, no Prisma, no sibling non-schema _services/ import, so it is safe to import from the client bundle.",
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
      serverImport:
        "A `*.schema.ts` must stay pure-Zod and may not import server-only code (`{{ source }}`). Move the server logic into a sibling service and keep this file Zod-only.",
      siblingService:
        "A `*.schema.ts` may not import a sibling non-schema `_services/` module (`{{ source }}`); that pulls server code into the client bundle. Import only `*.schema` files, helpers, or types.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SCHEMA_FILE_RE.test(filename)) return {};

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    const schemaInServices = SERVICES_PATH_RE.test(filename);

    return {
      ImportDeclaration(node) {
        // Type-only imports are erased at compile time and never reach the bundle.
        if (node.importKind === "type") return;

        const source = node.source.value;
        if (typeof source !== "string") return;

        if (SERVER_IMPORT_RE.test(source) || PRISMA_IMPORT_RE.test(source)) {
          context.report({
            node: node.source,
            messageId: "serverImport",
            data: { source },
          });
          return;
        }

        // Another schema is always fine.
        if (SCHEMA_IMPORT_RE.test(source)) return;

        // Deep import into any _services/ folder (non-schema) is a service module.
        if (SERVICES_IMPORT_RE.test(source)) {
          context.report({
            node: node.source,
            messageId: "siblingService",
            data: { source },
          });
          return;
        }

        // Same-directory relative import while we live inside _services/ -> sibling service.
        if (schemaInServices && SAME_DIR_IMPORT_RE.test(source)) {
          context.report({
            node: node.source,
            messageId: "siblingService",
            data: { source },
          });
        }
      },
    };
  },
};
