// A client module (`'use client'` directive or `*.client.ts(x)` filename) must
// not import `@/server/errors/*` (ADR-0012, domain errors). `instanceof
// DomainError` does not survive serialization across the network boundary, so a
// client checking it would silently never match. Client code branches on
// `error.data.code` instead. The DomainError classes also pull server-only code
// into the bundle.
//
// The four import forms and the relative spelling of the same path are covered
// by the shared import helper. A type-only import carries neither risk: it is
// erased before the bundler, and a type cannot be the right-hand side of
// `instanceof`.

import {
  clientModuleDetector,
  importVisitors,
  matchesSpecifier,
} from "./imports.js";

const SERVER_ERRORS_IMPORT_RE = /^@\/server\/errors(\/|$)/;

export const noClientImportOfServerErrorsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules ('use client' / *.client.ts(x)) may not import @/server/errors/* (instanceof does not survive serialization; branch on error.data.code).",
    },
    schema: [],
    messages: {
      clientImportsServerErrors:
        "Client modules may not import `@/server/errors/*` (`instanceof DomainError` does not survive serialization). Branch on `error.data.code` instead. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    const client = clientModuleDetector(context);

    return {
      Program: client.Program,
      ...importVisitors(context, (reference) => {
        if (!client.isClientModule()) return;
        if (reference.kind === "type") return;
        if (!matchesSpecifier(reference, SERVER_ERRORS_IMPORT_RE)) return;
        context.report({
          node: reference.node,
          messageId: "clientImportsServerErrors",
          data: { source: reference.source },
        });
      }),
    };
  },
};
