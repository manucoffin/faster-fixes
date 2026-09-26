// A client module (`'use client'` directive or `*.client.tsx` filename) must not
// import a `_services/` module, because services carry server-only deps (Prisma,
// Stripe, secrets) that would leak into the client bundle. Two exceptions:
//   1. `*.schema.ts`: schemas are pure-Zod (enforced by `schema-must-be-pure-zod`)
//      and are meant to be shared between the tRPC `.input()` and the client form
//      resolver (ADR-0009 / decision 12).
//   2. Type-only imports (`import type { … }` or all-`type` specifiers): TS erases
//      them at compile time, so they never reach the bundler and cannot leak a
//      runtime dep. The service return type is the type source of truth
//      (ADR-0009), so a client importing it directly is safe. Only the explicit
//      `type` marker is exempt — a value import stays blocked.

const SERVICES_IMPORT_RE = /(^|\/)_services\//;
const SCHEMA_RE = /\.schema(\.[jt]sx?)?$/;
const CLIENT_SUFFIX_RE = /\.client\.tsx?$/;
const USE_CLIENT_RE = /^['"]use client['"]/;

export const noClientImportOfServicesRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules ('use client' / *.client.tsx) may not import a _services/ module, except *.schema.ts.",
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
      clientImportsService:
        "Client modules may not import from `_services/` (server-only code leaks into the client bundle). Move the call behind a tRPC procedure, or import the `*.schema.ts` instead. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

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
        if (!SERVICES_IMPORT_RE.test(source)) return;
        if (SCHEMA_RE.test(source)) return;
        // Type-only imports are erased by TS and never reach the bundler.
        if (node.importKind === "type") return;
        const specifiers = node.specifiers ?? [];
        const hasNamed = specifiers.some((s) => s.type === "ImportSpecifier");
        if (
          hasNamed &&
          specifiers.every(
            (s) => s.type === "ImportSpecifier" && s.importKind === "type",
          )
        ) {
          return;
        }
        context.report({
          node: node.source,
          messageId: "clientImportsService",
          data: { source },
        });
      },
    };
  },
};
