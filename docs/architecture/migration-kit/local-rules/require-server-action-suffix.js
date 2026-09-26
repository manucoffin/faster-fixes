const USE_SERVER_RE = /^['"]use server['"]$/;
const SERVER_ACTION_FILENAME_RE = /\.server\.action\.ts$/;

export const requireServerActionSuffixRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A module-level 'use server' directive is only allowed in files named *.server.action.ts",
    },
    schema: [],
    messages: {
      unexpectedUseServer:
        "A module-level `'use server'` directive turns every export of this file into a public endpoint reachable without an authorisation check. Only `*.server.action.ts` files may carry it: move the action into such a file, or drop the directive (a server module needs none).",
    },
  },
  create(context) {
    if (SERVER_ACTION_FILENAME_RE.test(context.filename)) {
      return {};
    }

    return {
      Program(node) {
        // Walk the whole directive prologue: `'use strict'` may legally precede.
        for (const statement of node.body) {
          if (
            statement.type !== "ExpressionStatement" ||
            statement.expression.type !== "Literal" ||
            typeof statement.expression.value !== "string"
          ) {
            return;
          }

          if (USE_SERVER_RE.test(statement.expression.raw)) {
            context.report({
              node: statement,
              messageId: "unexpectedUseServer",
            });
            return;
          }
        }
      },
    };
  },
};
