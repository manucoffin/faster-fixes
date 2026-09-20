// An Inngest function is a service: it is a side-effecting orchestration, so it
// lives in a `_services/` folder under the `*.inngest.ts` name the conventions
// reserve for it (ADR-0011, server file conventions). Two halves of the same
// placement rule:
//
//   1. `inngest.createFunction(…)` outside a `*.inngest.ts(x)` file. The suffix
//      is load-bearing rather than decoration: `services-verb-prefix` and
//      `require-service-output-type` exempt a file by it, and a reader looking
//      for the durable functions of a scope finds them by it. A function minted
//      in a route handler or a feature has none of that.
//   2. A `*.inngest.ts(x)` file outside a `_services/` folder. The suffix
//      promises a service; the folder is what makes it one.
//
// The Inngest client itself (`new Inngest(…)` in `src/server/inngest/`) is
// wiring, not a function, and is untouched by this rule.

import { filenameOf } from "./imports.js";

const INNGEST_FILE_RE = /\.inngest\.tsx?$/;
const SERVICES_PATH_RE = /(^|\/)_services\//;

export const requireInngestFunctionPlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Inngest function creation is confined to `*.inngest.ts(x)` files, and those files to `_services/` folders.",
    },
    schema: [],
    messages: {
      creationOutsideInngestFile:
        "`createFunction` belongs to a `*.inngest.ts` service (ADR-0011). Move this durable function into a `_services/<name>.inngest.ts` file of the scope that owns it and call it from here.",
      inngestFileOutsideServices:
        "A `*.inngest.ts` file is a service (ADR-0011), so it belongs in the scope's `_services/` folder. Move this file there.",
    },
  },
  create(context) {
    const filename = filenameOf(context);
    const isInngestFile = INNGEST_FILE_RE.test(filename);

    return {
      Program(node) {
        if (!isInngestFile) return;
        if (SERVICES_PATH_RE.test(filename)) return;
        context.report({ node, messageId: "inngestFileOutsideServices" });
      },
      CallExpression(node) {
        if (isInngestFile) return;
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.property.name !== "createFunction") return;
        context.report({ node, messageId: "creationOutsideInngestFile" });
      },
    };
  },
};
