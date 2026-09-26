// A component that branches on a query's status flags by hand tends to forget a
// state, usually Empty, and to repeat its layout once per branch.
// `matchQueryStatus` takes the four states (Loading, Errored, Empty, Success)
// as one object and keeps the render declarative.
//
// Name-based rather than scope-based, like the `query.data ?? []` check of
// `no-restricted-patterns`: a query result is a `use*Query(...)` call, a
// variable assigned from one, or a variable named `query` / `*Query`. A
// mutation is neither, so `createProject.isPending` on a submit button passes.
//
// Only `.tsx` files are checked: a hook in a `.ts` file may derive a status
// from a query (the helper itself reads the flags), and the component that
// renders the hook's output is where the branch would be.

import { filenameOf } from "./imports.js";

const QUERY_HOOK_RE = /^use\w*Query$/;
const QUERY_NAME_RE = /^(?:query|.+Query)$/;

// The flags that split a query into its four states. `isFetching` and
// `isRefetching` are left out: they report a background refetch over data
// already on screen, which is a spinner on a control, not a render branch.
const STATUS_FLAGS = new Set([
  "isLoading",
  "isPending",
  "isError",
  "isSuccess",
  "status",
]);

/** The expression under a type assertion, a non-null assertion or a `?.` chain. */
function unwrap(node) {
  let current = node;
  while (
    current?.type === "TSAsExpression" ||
    current?.type === "TSSatisfiesExpression" ||
    current?.type === "TSNonNullExpression" ||
    current?.type === "ChainExpression"
  ) {
    current = current.expression;
  }
  return current;
}

function isQueryHookCall(node) {
  const call = unwrap(node);
  if (call?.type !== "CallExpression") return false;
  const { callee } = call;
  if (callee.type === "Identifier") return QUERY_HOOK_RE.test(callee.name);
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    QUERY_HOOK_RE.test(callee.property.name)
  );
}

function propertyName(property) {
  if (property.type !== "Property" || property.computed) return null;
  return property.key.type === "Identifier" ? property.key.name : null;
}

export const noQueryStatusBranchRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A component does not read a query's status flags (`isLoading`, `isPending`, `isError`, `isSuccess`, `status`): it renders the query through `matchQueryStatus`.",
    },
    schema: [],
    messages: {
      statusBranch:
        "Do not branch on `{{flag}}` of a query by hand: a hand-written branch tends to drop a state, usually Empty, and repeats the layout per branch. Render the query with `matchQueryStatus(query, { Loading, Errored, Empty, Success })` from `@/utils/tanstack-query/match-query-status`, and nest a second call around a child that needs the data rather than passing a flag down.",
    },
  },
  create(context) {
    if (!filenameOf(context).endsWith(".tsx")) return {};

    const queryVariables = new Set();
    // A receiver that is a plain identifier is resolved at Program:exit, once
    // every `const x = useXQuery()` of the file has been seen.
    const pending = [];

    const isQueryReceiver = (name) =>
      QUERY_NAME_RE.test(name) || queryVariables.has(name);

    return {
      "VariableDeclarator[id.type='Identifier']"(node) {
        if (isQueryHookCall(node.init)) queryVariables.add(node.id.name);
      },
      "VariableDeclarator[id.type='ObjectPattern']"(node) {
        const init = unwrap(node.init);
        const fromHook = isQueryHookCall(init);
        const receiver = init?.type === "Identifier" ? init.name : null;
        if (!fromHook && receiver === null) return;

        for (const property of node.id.properties) {
          const flag = propertyName(property);
          if (!STATUS_FLAGS.has(flag)) continue;
          pending.push({
            node: property,
            flag,
            receiver: fromHook ? null : receiver,
          });
        }
      },
      "MemberExpression[computed=false]"(node) {
        if (node.property.type !== "Identifier") return;
        const flag = node.property.name;
        if (!STATUS_FLAGS.has(flag)) return;

        const object = unwrap(node.object);
        if (isQueryHookCall(object)) {
          pending.push({ node, flag, receiver: null });
        } else if (object.type === "Identifier") {
          pending.push({ node, flag, receiver: object.name });
        }
      },
      "Program:exit"() {
        for (const { node, flag, receiver } of pending) {
          if (receiver !== null && !isQueryReceiver(receiver)) continue;
          context.report({ node, messageId: "statusBranch", data: { flag } });
        }
      },
    };
  },
};
