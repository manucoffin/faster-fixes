// A client module never branches on `instanceof DomainError`. `instanceof` does
// not survive the wire: the transport serializes the error, so what the client
// receives is data with the same shape and none of the prototype. The check
// therefore reads as a working guard and is always false, which is worse than a
// crash because the fallback branch silently swallows the case the author wrote
// it for. A client branches on the transported code instead (ADR-0012):
// `error.data.code` for tRPC, the `code` field of the JSON body for a route.
//
// The import rules already stop a client reaching `@/server/errors/`. This rule
// covers the shape rather than the specifier, so the test is reported wherever
// the binding came from: a re-export, a domain barrel, or a class declared in
// the file itself.

import { clientModuleDetector } from "./imports.js";

const DOMAIN_ERROR_NAME = "DomainError";

export const noClientDomainErrorInstanceofRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Client modules may not test `instanceof DomainError`: the prototype does not survive serialization, so the branch is always false.",
    },
    schema: [],
    messages: {
      clientInstanceofDomainError:
        "`instanceof DomainError` is always false in a client module: the transport serializes the error and the prototype is lost (ADR-0012). Branch on the transported code instead (`error.data.code` for tRPC, the `code` field of the response body for a route).",
    },
  },
  create(context) {
    const client = clientModuleDetector(context);

    return {
      Program: client.Program,
      BinaryExpression(node) {
        if (node.operator !== "instanceof") return;
        if (node.right.type !== "Identifier") return;
        if (node.right.name !== DOMAIN_ERROR_NAME) return;
        if (!client.isClientModule()) return;
        context.report({ node, messageId: "clientInstanceofDomainError" });
      },
    };
  },
};
