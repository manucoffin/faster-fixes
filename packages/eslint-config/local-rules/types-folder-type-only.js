// `_types/` bucket content (ADR-0010, app folder architecture; ADR-0011, server
// file conventions). The bucket holds standalone shared types, and a constant is
// a helper or a type, never a third thing. A type import is erased at build
// time, which is why every scope, client or server, may reach `_types/` freely:
// a runtime value in the bucket turns those imports into runtime edges that no
// boundary rule was written to see.
//
// The rule scopes itself by path, so it reports nothing outside a `_types/`
// folder whatever glob the config gives it.

const TYPES_SEGMENT = "_types";

const TYPE_DECLARATIONS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
]);

function isInTypesFolder(filename) {
  return filename.split(/[\\/]/).slice(0, -1).includes(TYPES_SEGMENT);
}

function isTypeOnlyDeclaration(declaration) {
  // An ambient `declare` emits nothing, whatever it declares.
  return (
    TYPE_DECLARATIONS.has(declaration.type) || declaration.declare === true
  );
}

function isTypeOnlyStatement(statement) {
  switch (statement.type) {
    case "ImportDeclaration":
      // A bare `import "x"` exists only for its side effect, which is runtime.
      return statement.specifiers.length > 0;
    case "TSTypeAliasDeclaration":
    case "TSInterfaceDeclaration":
      return true;
    case "TSModuleDeclaration":
      return statement.declare === true;
    case "ExportAllDeclaration":
      return statement.exportKind === "type";
    case "ExportNamedDeclaration":
      if (statement.declaration) {
        return isTypeOnlyDeclaration(statement.declaration);
      }
      // A local `export { A }` can only name a type, since values are banned
      // here. A re-export from another module must say `type`.
      return (
        statement.source === null ||
        statement.exportKind === "type" ||
        statement.specifiers.every(
          (specifier) => specifier.exportKind === "type",
        )
      );
    default:
      return isTypeOnlyDeclaration(statement);
  }
}

export const typesFolderTypeOnlyRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files under a `_types/` folder contain type declarations only; runtime code lives in another bucket.",
    },
    schema: [],
    messages: {
      runtimeInTypes:
        "`_types/` holds type declarations only (ADR-0010, ADR-0011). A type import is erased at build time, which is why client and server code reach this bucket freely; a runtime value here turns those imports into runtime edges. Move a constant or a pure function to `_helpers/` and an operation input to a `*.schema.ts` in `_services/`, then derive the type here through `import type`.",
    },
  },
  create(context) {
    if (!isInTypesFolder(context.filename)) return {};

    return {
      Program(node) {
        for (const statement of node.body) {
          if (!isTypeOnlyStatement(statement)) {
            context.report({ node: statement, messageId: "runtimeInTypes" });
          }
        }
      },
    };
  },
};
