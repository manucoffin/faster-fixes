// A Next.js error boundary (`error.tsx`, `global-error.tsx`) is the screen a
// user lands on when a render throws, so every one of them renders the shared
// error screen with fixed copy: the boundaries look the same, and none of them
// can show what the error says.
//
// The second half is the reason for the first. The message, the stack and the
// digest of a server error can carry a query, a path or an internal id, so the
// boundary never reads them: it logs the whole error object and shows copy
// written in advance. Passing `error` to `console.error` stays allowed, since
// it reads no field.
//
// The rule checks the basename itself, so it can be wired to the whole app and
// stays silent on every other file.

import path from "node:path";

import { filenameOf } from "./imports.js";

const BOUNDARY_BASENAMES = new Set(["error.tsx", "global-error.tsx"]);
const LEAKING_FIELDS = new Set(["message", "stack", "digest"]);
const DEFAULT_COMPONENT_NAME = "ErrorScreen";
const DEFAULT_ERROR_NAMES = ["error"];

function propertyNameOf(node) {
  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }
  if (
    node.computed &&
    node.property.type === "Literal" &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }
  return null;
}

export const errorBoundaryRendersErrorScreenRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A Next.js error boundary renders the shared error screen and never reads the message, stack or digest of the error.",
    },
    schema: [
      {
        type: "object",
        properties: {
          componentName: { type: "string" },
          errorNames: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingErrorScreen:
        "This error boundary does not render `<{{ componentName }}>`. Render the shared `{{ componentName }}` with fixed copy, so every boundary looks the same and shows nothing internal.",
      leakingField:
        "`{{ object }}.{{ field }}` reads the error itself. The text of a server error can leak internals (a query, a path, an id), so show fixed copy and log the error with `console.error({{ object }})` instead.",
    },
  },
  create(context) {
    const basename = path.posix.basename(filenameOf(context));
    if (!BOUNDARY_BASENAMES.has(basename)) return {};

    const [
      {
        componentName = DEFAULT_COMPONENT_NAME,
        errorNames = DEFAULT_ERROR_NAMES,
      } = {},
    ] = context.options;
    const errorNameSet = new Set(errorNames);
    let rendersErrorScreen = false;

    return {
      JSXOpeningElement(node) {
        if (
          node.name.type === "JSXIdentifier" &&
          node.name.name === componentName
        ) {
          rendersErrorScreen = true;
        }
      },
      MemberExpression(node) {
        if (node.object.type !== "Identifier") return;
        if (!errorNameSet.has(node.object.name)) return;

        const field = propertyNameOf(node);
        if (!LEAKING_FIELDS.has(field)) return;

        context.report({
          node,
          messageId: "leakingField",
          data: { object: node.object.name, field },
        });
      },
      "Program:exit"(node) {
        if (rendersErrorScreen) return;
        context.report({
          node,
          messageId: "missingErrorScreen",
          data: { componentName },
        });
      },
    };
  },
};
