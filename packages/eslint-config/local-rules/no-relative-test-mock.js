// A test mocks at a boundary or not at all. A relative specifier points inside
// the scope the test belongs to: the sibling service, the helper next door, the
// module under test itself. Faking one of those pins the shape of code the test
// is supposed to be free to reshape, and it hides the collaborator rather than
// injecting it, which is the seam the testing standard asks for.
//
// The boundaries a mock may sit at are the public surfaces the architecture
// already draws: the database package and its entry points, the cross-cutting
// server folder and the lib adapters (ADR-0010, ADR-0011), an external package,
// or another domain's barrel. Every one of them is spelled with an alias or a
// package name, so "not relative" is the whole check: the 80-odd mocks in the
// tree that mock at a boundary are written `@workspace/db`, `@/server/…`,
// `@/lib/…` or a package name, and none of them needs a relative path. A
// boundary module reached by walking up the tree is reported on the same
// terms: the alias is how this repo names it.
//
// The rule reads the call rather than the import graph, because a module double
// is registered by a call, and it covers the deregistering forms too: an
// `unmock` of a relative module only makes sense next to a mock of it.
//
// This is not a boundary rule in the not-disableable sense: a genuine one-off
// is a disable comment with a reason, read in the diff.

import { isRelativeSpecifier } from "./imports.js";

const MOCK_OBJECT = "vi";
const MOCK_METHODS = new Set(["mock", "doMock", "unmock", "doUnmock"]);

/** The specifier of `vi.mock("./x")` and of the `vi.mock(import("./x"))` form. */
function specifierNodeOf(argument) {
  if (!argument) return null;
  if (argument.type === "ImportExpression") {
    return specifierNodeOf(argument.source);
  }
  if (argument.type !== "Literal") return null;
  if (typeof argument.value !== "string") return null;
  return argument;
}

function isMockCall(node) {
  const callee = node.callee;

  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.object.name === MOCK_OBJECT &&
    callee.property.type === "Identifier" &&
    MOCK_METHODS.has(callee.property.name)
  );
}

export const noRelativeTestMockRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test may not mock a module of its own scope. A module double is registered at a boundary: the database package, the server folder, the lib folder, an external package, or another domain's barrel.",
    },
    schema: [],
    messages: {
      relativeMock:
        "`{{source}}` is a relative specifier. A test mocks at a boundary, named by alias or package: the database package (`@workspace/db`), the server folder (`@/server/...`), the lib folder (`@/lib/...`), an external package, or another domain's barrel (`@/app/_domains/<domain>`). A relative path either points inside this test's own scope or spells a boundary as if it were one. If the collaborator is reached through a singleton, mock that singleton's module; otherwise inject it as a parameter and pass a fake.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isMockCall(node)) return;

        const source = specifierNodeOf(node.arguments[0]);
        if (!source) return;
        if (!isRelativeSpecifier(source.value)) return;

        context.report({
          node: source,
          messageId: "relativeMock",
          data: { source: source.value },
        });
      },
    };
  },
};
