// A `_services/` module is transport-agnostic (ADR-0011, server file conventions):
// it must be callable from a tRPC procedure, an Inngest job, or a server action
// without an HTTP round-trip, so it must never import the tRPC layer. The
// `trpc-router.ts` at the scope root is the only place that wires tRPC, and it
// imports the services, not the other way around.
//
// The four import forms and the relative spelling of the same path are covered
// by the shared import helper. A type-only import is reported like any other:
// what this rule guards is coupling to a transport, not what reaches a bundle,
// and a service typed against tRPC is coupled to it whether or not the import
// survives compilation.

import { importVisitors, filenameOf, matchesSpecifier } from "./imports.js";

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
    schema: [],
    messages: {
      servicesImportsTrpc:
        "A `_services/` module must stay transport-agnostic and may not import tRPC (`{{ source }}`). Keep the tRPC wiring in the scope's root `trpc-router.ts` and call this service from there.",
    },
  },
  create(context) {
    if (!SERVICES_PATH_RE.test(filenameOf(context))) return {};

    return importVisitors(context, (reference) => {
      if (!matchesSpecifier(reference, TRPC_IMPORT_RE)) return;
      context.report({
        node: reference.node,
        messageId: "servicesImportsTrpc",
        data: { source: reference.source },
      });
    });
  },
};
