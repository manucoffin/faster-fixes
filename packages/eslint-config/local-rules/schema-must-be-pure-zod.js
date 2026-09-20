// A `*.schema.ts` must stay pure-Zod with no server-only imports (ADR-0011,
// server file conventions). Schemas live in `_services/` but are shared with the
// client form resolver; the bundler resolves per-file, so a schema that pulls in
// `@/server/`, Prisma, or a sibling (non-schema) service would drag server-only
// code into the client bundle. Allowed: `zod`, other `*.schema` files, and pure
// helpers/types.
//
// The four import forms and the relative spelling of the same path are covered
// by the shared import helper: a schema re-exporting a service reaches the
// bundle exactly like a schema importing one. A type-only import, declaration
// level or all-inline, is erased before the bundler and stays allowed.

import { importVisitors, filenameOf, matchesSpecifier } from "./imports.js";

const SCHEMA_FILE_RE = /\.schema\.ts$/;
const SCHEMA_IMPORT_RE = /\.schema(\.[jt]sx?)?$/;
const SERVICES_IMPORT_RE = /(^|\/)_services\//;

// Server-only import sources a pure schema must never reach for.
const SERVER_IMPORT_RE = /^@\/server\//;
// Only the Prisma *client* (server runtime) is forbidden. Generated enums/types
// (`@workspace/db/generated/prisma/enums`) are pure value/type objects,
// client-safe, and are the standard `z.nativeEnum(...)` source, so they are
// allowed. The database package of this repo is `@workspace/db`, reachable both
// at its root and through its explicit `/index` entrypoint.
const PRISMA_IMPORT_RE =
  /^(@prisma\/client(\/|$)|@workspace\/db(\/index)?$|@workspace\/db\/generated\/prisma\/client(\/|$))/;

export const schemaMustBePureZodRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A *.schema.ts must stay pure-Zod: no @/server/, no Prisma, no sibling non-schema _services/ import, so it is safe to import from the client bundle.",
    },
    schema: [],
    messages: {
      serverImport:
        "A `*.schema.ts` must stay pure-Zod and may not import server-only code (`{{ source }}`). Move the server logic into a sibling service and keep this file Zod-only.",
      siblingService:
        "A `*.schema.ts` may not import a sibling non-schema `_services/` module (`{{ source }}`); that pulls server code into the client bundle. Import only `*.schema` files, helpers, or types.",
    },
  },
  create(context) {
    if (!SCHEMA_FILE_RE.test(filenameOf(context))) return {};

    return importVisitors(context, (reference) => {
      if (reference.kind === "type") return;

      const data = { source: reference.source };

      if (
        matchesSpecifier(reference, SERVER_IMPORT_RE) ||
        matchesSpecifier(reference, PRISMA_IMPORT_RE)
      ) {
        context.report({
          node: reference.node,
          messageId: "serverImport",
          data,
        });
        return;
      }

      // Another schema is always fine, whichever folder it sits in.
      if (SCHEMA_IMPORT_RE.test(reference.source)) return;

      // Any module under a `_services/` folder is a service, whether addressed
      // by alias, by deep path or by a relative path from a sibling schema.
      if (matchesSpecifier(reference, SERVICES_IMPORT_RE)) {
        context.report({
          node: reference.node,
          messageId: "siblingService",
          data,
        });
      }
    });
  },
};
