// ADR-0010 vocabulary lock. Two bans, both straight at `error` (the converting
// PR makes them satisfiable, so they never ramp):
//  1. No import of the deprecated `@/lib/errors` module (or any
//     `_deprecated_errors` stub). The vocabulary lives in
//     `@/server/errors/domain-errors`.
//  2. No `ActionError` import outside `safe-action.ts`. `ActionError` is an
//     internal of the safe-action middlewares; call sites throw `DomainError`
//     subclasses instead.

const DEPRECATED_SOURCE_RE = /(^@\/lib\/errors$)|(_deprecated_errors$)/;
const SAFE_ACTION_RE = /\/server\/safe-action\.tsx?$/;
const SAFE_ACTION_SOURCE_RE =
  /(^@\/server\/safe-action$)|(\/server\/safe-action$)/;

export const noDeprecatedErrorImportsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban imports of the deprecated `@/lib/errors` module and of `ActionError` outside `safe-action.ts` (ADR-0010). Use `@/server/errors/domain-errors`.",
    },
    schema: [],
    messages: {
      deprecatedModule:
        "`{{ source }}` is deprecated (ADR-0010). Import the domain error vocabulary from `@/server/errors/domain-errors` instead.",
      actionErrorOutsideSafeAction:
        "`ActionError` may only be used inside `safe-action.ts`. Throw a `DomainError` subclass from `@/server/errors/domain-errors` instead.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const isSafeActionFile = SAFE_ACTION_RE.test(filename);

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;

        if (DEPRECATED_SOURCE_RE.test(source)) {
          context.report({
            node: node.source,
            messageId: "deprecatedModule",
            data: { source },
          });
          return;
        }

        if (isSafeActionFile) return;
        if (!SAFE_ACTION_SOURCE_RE.test(source)) return;
        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.name === "ActionError"
          ) {
            context.report({
              node: specifier,
              messageId: "actionErrorOutsideSafeAction",
            });
          }
        }
      },
    };
  },
};
