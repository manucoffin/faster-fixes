// A `*.schema.ts` must stay pure Zod (ADR-0011, server file conventions).
// Schemas live in `_services/` but are shared with the client form resolver;
// the bundler resolves per file, so anything a schema reaches for travels into
// the client bundle with it.
//
// The rule is an allowlist, not a denylist: a schema may import Zod, another
// schema, the generated Prisma enums, and the exceptions named in the shared
// config. Everything else is reported. A denylist only ever knew the leaks
// somebody had already met (`@/server/`, the Prisma client, a sibling
// service), so the next server-only specifier to appear in a schema was
// admitted by default. This way round, the new import is the one that has to
// argue for itself.
//
// The four import forms and the relative spelling of the same path are covered
// by the shared import helper: a schema re-exporting a service reaches the
// bundle exactly like a schema importing one. A type-only import, declaration
// level or all-inline, is erased before the bundler and stays allowed whatever
// it points at.

import { importVisitors, filenameOf, matchesSpecifier } from "./imports.js";

const SCHEMA_FILE_RE = /\.schema\.ts$/;

// Zod itself, root or subpath entry point.
const ZOD_IMPORT_RE = /^zod(\/|$)/;

// Another schema, whichever folder it sits in and however it is addressed.
// Cross-file composition (the create -> update pair) is the documented norm.
const SCHEMA_IMPORT_RE = /\.schema(\.[jt]sx?)?$/;

// The generated enums module is types and string unions, and is the sanctioned
// `z.enum(PrismaEnum)` source. The database package's other entry points pull
// the Prisma client in and are not on this list.
const PRISMA_ENUMS_IMPORT_RE = /^@workspace\/db\/generated\/prisma\/enums$/;

export const schemaMustBePureZodRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A *.schema.ts may import only Zod, another *.schema file, the generated Prisma enums and the exceptions named in the shared config, so it is safe to import from the client bundle.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowImportPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      importNotAllowed:
        "A `*.schema.ts` must stay pure Zod: it may import `zod`, another `*.schema` file, `@workspace/db/generated/prisma/enums`, or an exception named in the shared ESLint config. Move the logic into a sibling service, or add a reviewed exception. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    if (!SCHEMA_FILE_RE.test(filenameOf(context))) return {};

    const [{ allowImportPatterns = [] } = {}] = context.options;
    const allowed = [
      ZOD_IMPORT_RE,
      SCHEMA_IMPORT_RE,
      PRISMA_ENUMS_IMPORT_RE,
      ...allowImportPatterns.map((pattern) => new RegExp(pattern)),
    ];

    return importVisitors(context, (reference) => {
      if (reference.kind === "type") return;
      if (allowed.some((pattern) => matchesSpecifier(reference, pattern))) {
        return;
      }

      context.report({
        node: reference.node,
        messageId: "importNotAllowed",
        data: { source: reference.source },
      });
    });
  },
};
