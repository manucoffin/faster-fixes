// The naming conventions of a `*.schema.ts` (ADR-0011, server file
// conventions): an exported value is a `*Schema`, and a type suffixed `Input`
// or `Values` is the inferred type of a schema of the same file.
//
// The rule reads every export form, not just `export const` and
// `export type X = …`: `export { X }`, `export type { X }`, an exported
// function, enum or interface all reach the same public surface, so an export
// form is not a way past the convention.
//
// What the rule does not ask for is as deliberate as what it does. A schema
// file need not export an `Input` type: a shared fragment composed by its
// neighbours (`update-*.schema.ts` extending `create-*.schema.ts`) has no
// input of its own to name. And a type that is not an input keeps its real
// name, because the standard says so: `Input` is correct only while the schema
// validates the input of an operation. The suffixes that are claimed are the
// ones that are checked.
//
// The two bans of the schema standard live here too, because the file they
// apply to is the file this rule already visits: `z.nativeEnum` (deprecated in
// zod 4, `z.enum` absorbs a Prisma enum) and `.merge()` (deprecated in zod 4,
// spread the other schema's shape).

const SCHEMA_FILE_RE = /\.schema\.ts$/;
const UPPER_SNAKE_CASE_RE = /^[A-Z][A-Z0-9_]*$/;
// A retired schema is an empty `_deprecated_*` stub by repo convention, so it
// has no exports left to name.
const DEPRECATED_FILE_RE = /(^|[/\\])_deprecated_/;

// `z.infer` for the parsed type, `z.input` for the pre-parse form values type.
const SUFFIX_INFERENCE = { Input: "infer", Values: "input" };

function isTopLevel(node) {
  const parent = node.parent;
  return (
    parent?.type === "Program" || parent?.type === "ExportNamedDeclaration"
  );
}

/**
 * The `typeof X` target of a `<namespace>.<helper><typeof X>` annotation, or
 * null when the annotation is anything else. `z` is not pinned by name: a file
 * importing Zod under another alias writes the same convention.
 */
function inferenceTargetOf(annotation, helper) {
  if (annotation?.type !== "TSTypeReference") return null;

  const typeName = annotation.typeName;
  if (typeName?.type !== "TSQualifiedName" || typeName.right?.name !== helper) {
    return null;
  }

  const typeArgs = annotation.typeArguments || annotation.typeParameters;
  const first = typeArgs?.params?.[0];
  if (first?.type !== "TSTypeQuery" || first.exprName?.type !== "Identifier") {
    return null;
  }
  return first.exprName.name;
}

export const requireSchemaConventionsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce the conventions of a .schema.ts file: an exported value is named `*Schema`, a type suffixed `Input` is `z.infer` and a type suffixed `Values` is `z.input` of a schema of the same file, and the two deprecated Zod calls are refused.",
    },
    schema: [
      {
        type: "object",
        properties: {
          // When true, an exported `*Schema` const must be PascalCase
          // (start with an uppercase letter): `PrestationSchema`, not
          // `prestationSchema`.
          requirePascalCaseSchema: { type: "boolean" },
          // When true, an exported input type must use the singular `Input`
          // suffix: `CreateInvoiceInput`, never the plural `Inputs`.
          requireSingularInput: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingSchemaSuffix:
        "Exported `{{ name }}` in a .schema.ts file must end with `Schema` (e.g. `{{ name }}Schema`). A .schema.ts file exports schemas and their inferred types, nothing else.",
      schemaNotPascalCase:
        "Exported schema `{{ name }}` must be PascalCase, i.e. start with an uppercase letter (e.g. `{{ pascalName }}`).",
      pluralInputSuffix:
        "Exported type `{{ name }}` must use the singular `Input` suffix, not plural `Inputs` (e.g. `{{ singularName }}`).",
      notInferredFromSchema:
        "Exported type `{{ name }}` claims the `{{ suffix }}` suffix, so it must be `z.{{ helper }}<typeof SomeSchema>` of a schema declared in this file. Write `export type {{ name }} = z.{{ helper }}<typeof SomeSchema>;`, or name the type for what it actually is (ADR-0011).",
      noExportedSchema:
        "This .schema.ts file must export at least one const ending with `Schema`.",
      nativeEnumDeprecated:
        "`z.nativeEnum()` is deprecated in zod 4. Use `z.enum(PrismaEnum)`: `z.enum()` absorbs an enum-like object.",
      mergeDeprecated:
        "`.merge()` is deprecated in zod 4. Spread the other schema's shape instead: `Base.extend(Other.shape)`, or `z.object({ ...Base.shape, ...Other.shape })`.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (!SCHEMA_FILE_RE.test(filename) || DEPRECATED_FILE_RE.test(filename)) {
      return {};
    }

    const [
      { requirePascalCaseSchema = false, requireSingularInput = false } = {},
    ] = context.options;

    // Every top-level binding of the file, so an export specifier can be read
    // back to what it exports. A value declared here is a candidate schema for
    // the `typeof` check; a type alias carries the annotation that check reads.
    const values = new Set();
    const typeAliases = new Map();
    // Resolved at `Program:exit`, because `export { X }` may precede the
    // declaration of `X`.
    const exports = [];
    let hasSchemaExport = false;

    function collectExport(name, node, isType) {
      exports.push({ name, node, isType });
    }

    function checkValueName(name, node) {
      if (name.endsWith("Schema")) {
        hasSchemaExport = true;
        if (requirePascalCaseSchema && !/^[A-Z]/.test(name)) {
          context.report({
            node,
            messageId: "schemaNotPascalCase",
            data: {
              name,
              pascalName: name.charAt(0).toUpperCase() + name.slice(1),
            },
          });
        }
        return;
      }
      // UPPER_CASE constants (config values, limits) are not schemas and are
      // not named as if they were.
      if (UPPER_SNAKE_CASE_RE.test(name)) return;

      context.report({
        node,
        messageId: "missingSchemaSuffix",
        data: { name },
      });
    }

    function checkTypeName(name, node) {
      if (name.endsWith("Inputs")) {
        if (requireSingularInput) {
          context.report({
            node,
            messageId: "pluralInputSuffix",
            data: { name, singularName: name.slice(0, -1) },
          });
        }
        return;
      }

      const suffix = Object.keys(SUFFIX_INFERENCE).find((candidate) =>
        name.endsWith(candidate),
      );
      // A type that claims neither suffix is a type the schema needed under its
      // own name. The standard allows it; nothing here to check.
      if (!suffix) return;

      const helper = SUFFIX_INFERENCE[suffix];
      const target = inferenceTargetOf(
        typeAliases.get(name)?.typeAnnotation,
        helper,
      );
      if (target !== null && values.has(target)) return;

      context.report({
        node,
        messageId: "notInferredFromSchema",
        data: { name, suffix, helper },
      });
    }

    return {
      VariableDeclaration(node) {
        if (!isTopLevel(node)) return;
        for (const declarator of node.declarations) {
          if (declarator.id?.type === "Identifier") {
            values.add(declarator.id.name);
          }
        }
      },
      "FunctionDeclaration, TSEnumDeclaration, ClassDeclaration"(node) {
        if (isTopLevel(node) && node.id) values.add(node.id.name);
      },
      TSTypeAliasDeclaration(node) {
        if (isTopLevel(node)) typeAliases.set(node.id.name, node);
      },
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (declaration) {
          if (declaration.type === "VariableDeclaration") {
            for (const declarator of declaration.declarations) {
              if (declarator.id?.type === "Identifier") {
                collectExport(declarator.id.name, declarator.id, false);
              }
            }
          } else if (declaration.id) {
            const isType =
              declaration.type === "TSTypeAliasDeclaration" ||
              declaration.type === "TSInterfaceDeclaration";
            collectExport(declaration.id.name, declaration.id, isType);
          }
          return;
        }

        for (const specifier of node.specifiers) {
          // The exported name is the public one, so `export { X as Y }` is
          // judged as `Y`. A re-export from another module names a binding this
          // file cannot read, which is why an `Input` suffix on one is reported:
          // the convention wants the schema next to the type.
          const isType =
            node.exportKind === "type" || specifier.exportKind === "type";
          collectExport(specifier.exported.name, specifier, isType);
        }
      },
      MemberExpression(node) {
        if (node.property?.type !== "Identifier") return;
        if (node.property.name === "nativeEnum") {
          context.report({ node, messageId: "nativeEnumDeprecated" });
        }
        if (
          node.property.name === "merge" &&
          node.parent?.type === "CallExpression" &&
          node.parent.callee === node
        ) {
          context.report({ node, messageId: "mergeDeprecated" });
        }
      },
      "Program:exit"(node) {
        for (const { name, node: reportNode, isType } of exports) {
          if (isType || typeAliases.has(name)) {
            checkTypeName(name, reportNode);
          } else {
            checkValueName(name, reportNode);
          }
        }

        if (!hasSchemaExport) {
          context.report({ node, messageId: "noExportedSchema" });
        }
      },
    };
  },
};
