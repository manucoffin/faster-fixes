// Three shapes the coding standards reject, in one rule because none of them
// has a plugin rule to lean on and none is worth a file of its own.
//
//   1. A TypeScript `enum`. The standard prefers a union type: an enum emits a
//      runtime object the bundler cannot drop, and its members are nominal, so
//      a plain string read off the wire is not assignable to it.
//   2. An `as unknown as T` double cast. It asserts two things at once and
//      checks neither, so the compiler stops being the thing that tells you
//      the shape is wrong.
//   3. `query.data ?? []` as a list. The fallback turns a failed read into an
//      empty list, and the child renders "No teams available": an empty state
//      standing in for an error.
//
// One rule rather than three blocks of the core restricted-syntax rule: flat
// config replaces rather than merges two blocks of the same core rule matching
// one file, so the second block written that way would silently delete the
// first. The messages also have to name an alternative, which a selector list
// cannot do per pattern without repeating the whole block.

import { filenameOf } from "./imports.js";

// The query result a component holds: `pageUrlsQuery`, or plain `query` when
// the component has only one. The fallback is only a lie about a read when the
// thing falling back is the read.
const QUERY_NAME_RE = /^(?:query|.+Query)$/;

/** `a?.b` parses as a chain around the member expression; the shape is the same. */
function unwrapChain(node) {
  return node.type === "ChainExpression" ? node.expression : node;
}

function isQueryData(node) {
  const target = unwrapChain(node);
  if (target.type !== "MemberExpression" || target.computed) return false;
  if (target.property.type !== "Identifier") return false;
  if (target.property.name !== "data") return false;
  return (
    target.object.type === "Identifier" &&
    QUERY_NAME_RE.test(target.object.name)
  );
}

function isEmptyArray(node) {
  return node.type === "ArrayExpression" && node.elements.length === 0;
}

// `x as unknown as T` nests: the outer assertion reads an inner one whose own
// target type is the widening step. `any` is the same move spelled differently.
function isDoubleCast(node) {
  const inner = node.expression;
  if (inner.type !== "TSAsExpression") return false;
  const widened = inner.typeAnnotation.type;
  return widened === "TSUnknownKeyword" || widened === "TSAnyKeyword";
}

export const noRestrictedPatternsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Reject the three shapes with no plugin rule of their own: a TypeScript `enum`, an `as unknown as` double cast, and an empty-array fallback on a query result.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowDoubleCastPathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noEnum:
        'Use a union type rather than a TypeScript `enum`. Declare the values as a `const` object (`export const Status = { Active: "active" } as const`) and the type as a union of them (`export type Status = (typeof Status)[keyof typeof Status]`): the object still gives you `Status.Active` and `Object.values(Status)`, and a string read off the wire is assignable to the type.',
      noDoubleCast:
        "`as unknown as T` asserts twice and checks neither. Fix the underlying type instead: widen the parameter, narrow with a type guard, or give the value the type it really has.",
      noEmptyArrayFallback:
        "`query.data ?? []` renders a failed read as an empty list, so the child shows its empty state instead of the error. Nest `matchQueryStatus(query, { Loading, Errored, Success })` around the child and pass the success data, or read the length off `query.data?.length ?? 0` when all you need is a count.",
    },
  },
  create(context) {
    const [{ allowDoubleCastPathPatterns = [] } = {}] = context.options;
    const filename = filenameOf(context);
    const doubleCastAllowed = allowDoubleCastPathPatterns.some((pattern) =>
      new RegExp(pattern).test(filename),
    );

    return {
      TSEnumDeclaration(node) {
        context.report({ node, messageId: "noEnum" });
      },
      TSAsExpression(node) {
        if (doubleCastAllowed) return;
        if (!isDoubleCast(node)) return;
        context.report({ node, messageId: "noDoubleCast" });
      },
      LogicalExpression(node) {
        if (node.operator !== "??") return;
        if (!isEmptyArray(node.right)) return;
        if (!isQueryData(node.left)) return;
        context.report({ node, messageId: "noEmptyArrayFallback" });
      },
    };
  },
};
