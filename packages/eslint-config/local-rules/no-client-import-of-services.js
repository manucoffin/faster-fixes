// A client module (`'use client'` directive or `*.client.ts(x)` filename) must
// not import a `_services/` module, because services carry server-only deps
// (Prisma, Stripe, secrets) that would leak into the client bundle. Two
// exceptions:
//   1. `*.schema.ts`: schemas are pure-Zod (enforced by `schema-must-be-pure-zod`)
//      and are meant to be shared between the tRPC `.input()` and the client form
//      resolver (ADR-0011, server file conventions).
//   2. Type-only imports (`import type { … }` or all-`type` specifiers): TS erases
//      them at compile time, so they never reach the bundler and cannot leak a
//      runtime dep. The service return type is the type source of truth
//      (ADR-0011), so a client importing it directly is safe. Only the explicit
//      `type` marker is exempt — a value import stays blocked.
//
// The four import forms and the relative spelling of the same path are covered
// by the shared import helper: a re-export or a dynamic `import()` reaches the
// bundle exactly like a static import.

import {
  clientModuleDetector,
  importVisitors,
  matchesSpecifier,
} from "./imports.js";

const SERVICES_IMPORT_RE = /(^|\/)_services\//;
const SCHEMA_IMPORT_RE = /\.schema(\.[jt]sx?)?$/;

export const noClientImportOfServicesRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules ('use client' / *.client.ts(x)) may not import a _services/ module, except *.schema.ts.",
    },
    schema: [],
    messages: {
      clientImportsService:
        "Client modules may not import from `_services/` (server-only code leaks into the client bundle). Move the call behind a tRPC procedure, or import the `*.schema.ts` instead. Offending import: `{{ source }}`.",
    },
  },
  create(context) {
    const client = clientModuleDetector(context);

    return {
      Program: client.Program,
      ...importVisitors(context, (reference) => {
        if (!client.isClientModule()) return;
        if (reference.kind === "type") return;
        if (!matchesSpecifier(reference, SERVICES_IMPORT_RE)) return;
        if (SCHEMA_IMPORT_RE.test(reference.source)) return;
        context.report({
          node: reference.node,
          messageId: "clientImportsService",
          data: { source: reference.source },
        });
      }),
    };
  },
};
