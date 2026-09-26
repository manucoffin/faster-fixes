// A `_services/` file exports the operation it is named after: `get-user.ts`
// exports `getUser` (ADR-0011, server file conventions). The filename is the
// index a reader or an agent greps for, so it has to point at a real export,
// and nothing else callable may hide behind it.
//
// This rule owns the export half of that convention; `services-verb-prefix`
// owns the verb half and says nothing about exports, so one fix is never
// reported twice. It checks two things:
//   1. a drifted export — every exported function whose name differs from the
//                         file is reported (`exportNameMismatch`). A second
//                         callable belongs in its own file or in `_helpers/`;
//   2. a missing export — the file exports no value by its name at all: it
//                         only exports types, the operation is a default
//                         export, or it is a non-function value under another
//                         name (`missingNamedExport`). It is reported only when
//                         check 1 found nothing, because a drifted function is
//                         usually the operation itself and the rename fixes
//                         both.
//
// The same files are exempt as in `services-verb-prefix`, and for the same
// reasons: the barrel, a schema, an Inngest job, a test, an `_`-prefixed
// private helper or retired stub, and a noun-named module recognised by a
// suffix from the `exemptSuffixes` option (an SDK client, an error class, a
// cipher). The config passes `serviceVerbOptions.exemptSuffixes`, so the two
// rules read one list.
//
// Any value export counts as the match, not only a function literal: a service
// wrapped in `cache(...)` or built by a factory is still the operation the file
// names. Only a function can drift, so an exported constant under another name
// (a Prisma `select`) is left alone. The comparison ignores letter case: a
// kebab basename cannot carry the house spelling of a proper noun, so
// `get-github-installation.ts` may export `getGitHubInstallation`.

const SERVICES_PATH_RE = /(^|\/)_services\//;

const EXEMPT_BASENAME_RE =
  /(?:\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_|\.test\.tsx?$|\.spec\.tsx?$)/;

const TYPE_DECLARATIONS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSDeclareFunction",
]);

function stemOf(basename) {
  return basename.replace(/\.tsx?$/, "");
}

function camelCaseOf(stem) {
  return stem.replace(/-([a-z0-9])/g, (_, character) =>
    character.toUpperCase(),
  );
}

function isFunctionValued(node) {
  return (
    node?.type === "FunctionDeclaration" ||
    node?.type === "FunctionExpression" ||
    node?.type === "ArrowFunctionExpression"
  );
}

// Top-level functions, so `export { getPlan }` can be judged wherever the
// declaration sits in the file.
function localFunctionNames(program) {
  const names = new Set();
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration"
        ? statement.declaration
        : statement;
    if (declaration?.type === "FunctionDeclaration" && declaration.id) {
      names.add(declaration.id.name);
    }
    if (declaration?.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (
          declarator.id.type === "Identifier" &&
          isFunctionValued(declarator.init)
        ) {
          names.add(declarator.id.name);
        }
      }
    }
  }
  return names;
}

function declaredValueExports(declaration) {
  if (!declaration || TYPE_DECLARATIONS.has(declaration.type)) return [];
  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations
      .filter((declarator) => declarator.id.type === "Identifier")
      .map((declarator) => ({
        node: declarator.id,
        name: declarator.id.name,
        isFunction: isFunctionValued(declarator.init),
      }));
  }
  if (!declaration.id) return [];
  return [
    {
      node: declaration.id,
      name: declaration.id.name,
      isFunction: declaration.type === "FunctionDeclaration",
    },
  ];
}

function valueExports(program) {
  const functionNames = localFunctionNames(program);
  const exports = [];
  for (const statement of program.body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    if (statement.exportKind === "type") continue;

    exports.push(...declaredValueExports(statement.declaration));
    for (const specifier of statement.specifiers) {
      if (specifier.exportKind === "type") continue;
      if (specifier.exported.type !== "Identifier") continue;
      exports.push({
        node: specifier,
        name: specifier.exported.name,
        // A re-export from another module is a value, but not a function this
        // file declares, so it can match and never drifts.
        isFunction:
          !statement.source && functionNames.has(specifier.local.name),
      });
    }
  }
  return exports;
}

export const servicesFilenameMatchesExportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A non-exempt file in _services/ exports a value named after the file (`get-user.ts` exports `getUser`), and no exported function under another name.",
    },
    schema: [
      {
        type: "object",
        properties: {
          exemptSuffixes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      exportNameMismatch:
        "`{{ exported }}` is exported from `{{ basename }}`, which is named after a different function. A service file is plain-named after its export: rename the function to `{{ expected }}`, or move it to its own file or to `_helpers/`.",
      missingNamedExport:
        "`{{ basename }}` does not export `{{ expected }}`. A `_services/` file is named after the operation it exports (ADR-0011), so the filename is where a reader looks for it: rename the file to match its operation, or rename the operation to match the file. A type-only or default export does not count.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const basename = filename.split(/[/\\]/).pop() || "";
    if (EXEMPT_BASENAME_RE.test(basename)) return {};

    const stem = stemOf(basename);
    const exemptSuffixes = context.options[0]?.exemptSuffixes ?? [];
    if (exemptSuffixes.some((suffix) => stem.endsWith(`-${suffix}`))) return {};

    const expected = camelCaseOf(stem);
    const matches = (name) => name.toLowerCase() === expected.toLowerCase();

    return {
      Program(node) {
        const exports = valueExports(node);
        const drifted = exports.filter(
          (exported) => exported.isFunction && !matches(exported.name),
        );

        for (const exported of drifted) {
          context.report({
            node: exported.node,
            messageId: "exportNameMismatch",
            data: { exported: exported.name, basename, expected },
          });
        }

        if (drifted.length > 0) return;
        if (exports.some((exported) => matches(exported.name))) return;
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: "missingNamedExport",
          data: { basename, expected },
        });
      },
    };
  },
};
