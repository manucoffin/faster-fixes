// A client module (`'use client'` directive or `*.client.ts(x)` filename) must
// not import a runtime value from anywhere in the server folder. Two reasons,
// and the second is why the guard covers the whole folder rather than the
// errors bucket alone:
//
//   1. `instanceof DomainError` does not survive serialization across the
//      network boundary, so a client checking it would silently never match.
//      Client code branches on `error.data.code` instead (ADR-0012).
//   2. The server folder holds wiring and cross-cutting abstractions: a
//      runtime import from it drags the Better Auth instance, the Stripe
//      client, Prisma or a secret-reading module into the client bundle.
//
// A module of the server folder that a client may legitimately call is a
// module that does not belong there: the folder admits wiring and server-only
// cross-cutting abstractions only, so the fix is normally to move the value to
// `src/utils/` or `src/lib/`. Where that is genuinely impossible, the
// exception is a named pattern in the shared config, reviewed like the server
// folder deep-import exemptions.
//
// A type-only import carries neither risk: it is erased before the bundler,
// and a type cannot be the right-hand side of `instanceof`. The four import
// forms and the relative spelling of the same path are covered by the shared
// import helper.

import {
  clientModuleDetector,
  importVisitors,
  matchesSpecifier,
} from "./imports.js";

// Both spellings of the same folder: the `@/server/…` alias, and a relative
// path that resolves under `…/src/server/`.
const SERVER_FOLDER_IMPORT_RE = /(^@\/|\/src\/)server(\/|$)/;

export const noClientImportOfServerFolderRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules ('use client' / *.client.ts(x)) may not import a runtime value from the server folder (server-only code leaks into the client bundle; instanceof does not survive serialization).",
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
      clientImportsServerFolder:
        "Client modules may not import a runtime value from the server folder (server-only code leaks into the client bundle, and `instanceof DomainError` does not survive serialization). Move the value to `src/utils/` or `src/lib/`, call it through a tRPC procedure, or branch on `error.data.code`. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    const client = clientModuleDetector(context);
    const [{ allowImportPatterns = [] } = {}] = context.options;
    const allowed = allowImportPatterns.map((pattern) => new RegExp(pattern));

    return {
      Program: client.Program,
      ...importVisitors(context, (reference) => {
        if (!client.isClientModule()) return;
        if (reference.kind === "type") return;
        if (!matchesSpecifier(reference, SERVER_FOLDER_IMPORT_RE)) return;
        if (allowed.some((pattern) => matchesSpecifier(reference, pattern))) {
          return;
        }
        context.report({
          node: reference.node,
          messageId: "clientImportsServerFolder",
          data: { source: reference.source },
        });
      }),
    };
  },
};
