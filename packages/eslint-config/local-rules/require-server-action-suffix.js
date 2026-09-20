const USE_SERVER_RE = /^['"]use server['"]$/;
const SERVER_ACTION_FILENAME_RE = /\.server\.action\.ts$/;

/**
 * The `'use server'` statement of a directive prologue, or null. Walks the
 * whole prologue, because `'use strict'` may legally precede, and stops at the
 * first statement that is not a string expression: past that point a string on
 * its own line is dead code, not a directive.
 */
function useServerDirectiveIn(statements) {
  for (const statement of statements) {
    if (
      statement.type !== "ExpressionStatement" ||
      statement.expression.type !== "Literal" ||
      typeof statement.expression.value !== "string"
    ) {
      return null;
    }

    if (USE_SERVER_RE.test(statement.expression.raw)) return statement;
  }

  return null;
}

export const requireServerActionSuffixRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A 'use server' directive, at module or function level, is only allowed in files named *.server.action.ts",
    },
    schema: [],
    messages: {
      unexpectedUseServer:
        "A module-level `'use server'` directive turns every export of this file into a public endpoint reachable without an authorisation check. Only `*.server.action.ts` files may carry it: move the action into such a file, or drop the directive (a server module needs none).",
      unexpectedFunctionUseServer:
        "A function-level `'use server'` directive turns this function into a public endpoint reachable without an authorisation check, under no name a reader can find. Only `*.server.action.ts` files may carry a `'use server'` directive: move the action into such a file, or call a tRPC procedure instead.",
    },
  },
  create(context) {
    if (SERVER_ACTION_FILENAME_RE.test(context.filename)) {
      return {};
    }

    return {
      Program(node) {
        const directive = useServerDirectiveIn(node.body);
        if (directive) {
          context.report({ node: directive, messageId: "unexpectedUseServer" });
        }
      },
      // An inline server action: the same public endpoint as a module-level
      // directive, minted inside any function body, so it is held to the same
      // rule rather than to none.
      ":function > BlockStatement"(node) {
        const directive = useServerDirectiveIn(node.body);
        if (directive) {
          context.report({
            node: directive,
            messageId: "unexpectedFunctionUseServer",
          });
        }
      },
    };
  },
};
