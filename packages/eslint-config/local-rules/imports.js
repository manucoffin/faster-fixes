// The import view every import rule reads, so that a hole closed once is closed
// everywhere. Four things live here:
//
//   1. The four import forms. A forbidden dependency travels just as well on
//      `export … from`, `export *` and dynamic `import()` as on a static
//      `import`, so a rule that visits `ImportDeclaration` alone is bypassable
//      by rewriting the line.
//   2. Specifier resolution. A relative path is resolved against the importing
//      file and, when it lands under a `src/` root, expressed in its `@/` alias
//      form, so an alias pattern catches the relative spelling of the same
//      module.
//   3. Import kind. A declaration-level (`import type { … }`) or all-inline
//      (`import { type X }`) type import is erased by TypeScript and never
//      reaches the bundler, so a bundle rule may accept it.
//   4. Client module detection: a `'use client'` directive in the prologue, or
//      a `.client.ts`/`.client.tsx` basename. All three client rules ask the
//      same question, so they ask it in one place.
//
// This module has no test suite of its own: it is observed through the rules
// that consume it.

import path from "node:path";

const RELATIVE_RE = /^\.\.?(\/|$)/;
// Greedy up to the last `/src/`, so a repository path that happens to contain
// an earlier `src` segment still yields the app's own alias root.
const SRC_ROOT_RE = /^(.*)\/src\/(.+)$/;
const CLIENT_SUFFIX_RE = /\.client\.tsx?$/;
const USE_CLIENT_RE = /^['"]use client['"]$/;

/** Windows separators normalised away, so every pattern is written posix-style. */
export function normalizePath(filename) {
  return (filename ?? "").replace(/\\/g, "/");
}

/**
 * True when a specifier points inside the importing file's own folder tree
 * rather than at an alias or a package. The mock rule asks this of a
 * `vi.mock()` argument, which is a specifier carried by a call rather than by
 * an import declaration.
 */
export function isRelativeSpecifier(source) {
  return RELATIVE_RE.test(source);
}

export function filenameOf(context) {
  return normalizePath(context.filename || context.getFilename());
}

/**
 * The forms of one specifier a convention may be matched against.
 *
 * @typedef {object} ImportReference
 * @property {import("estree").Node} node the source literal, to report on
 * @property {string} source the specifier as written
 * @property {boolean} isRelative
 * @property {string|null} resolvedPath absolute posix path, for a relative specifier
 * @property {string|null} alias the `@/…` form, when the module has one
 * @property {"value"|"type"} kind
 */

function referenceFor(filename, node, kind) {
  const source = node.value;
  const isRelative = isRelativeSpecifier(source);
  const resolvedPath = isRelative
    ? path.posix.resolve(path.posix.dirname(filename), source)
    : null;

  let alias = null;
  if (source.startsWith("@/")) {
    alias = source;
  } else if (resolvedPath) {
    const match = resolvedPath.match(SRC_ROOT_RE);
    if (match) alias = `@/${match[2]}`;
  }

  return { node, source, isRelative, resolvedPath, alias, kind };
}

/** True when the pattern matches any spelling of the same module. */
export function matchesSpecifier(reference, pattern) {
  return [reference.source, reference.alias, reference.resolvedPath].some(
    (form) => typeof form === "string" && pattern.test(form),
  );
}

function importDeclarationKind(node) {
  if (node.importKind === "type") return "type";
  const specifiers = node.specifiers ?? [];
  const named = specifiers.filter((s) => s.type === "ImportSpecifier");
  if (named.length > 0 && named.length === specifiers.length) {
    return named.every((s) => s.importKind === "type") ? "type" : "value";
  }
  return "value";
}

function exportDeclarationKind(node) {
  if (node.exportKind === "type") return "type";
  const specifiers = node.specifiers ?? [];
  if (
    specifiers.length > 0 &&
    specifiers.every((s) => s.exportKind === "type")
  ) {
    return "type";
  }
  return "value";
}

/**
 * The visitor covering the four import forms. `onImport` receives one
 * {@link ImportReference} per specifier, whatever form carried it.
 */
export function importVisitors(context, onImport) {
  const filename = filenameOf(context);

  function visit(node, kind) {
    const source = node.source;
    if (!source || source.type !== "Literal") return;
    if (typeof source.value !== "string") return;
    onImport(referenceFor(filename, source, kind));
  }

  return {
    ImportDeclaration: (node) => visit(node, importDeclarationKind(node)),
    ExportNamedDeclaration: (node) => visit(node, exportDeclarationKind(node)),
    ExportAllDeclaration: (node) => visit(node, exportDeclarationKind(node)),
    // A dynamic import is always a runtime edge: there is no type form of it.
    ImportExpression: (node) => visit(node, "value"),
  };
}

export function isClientFilename(filename) {
  return CLIENT_SUFFIX_RE.test(normalizePath(filename));
}

function hasUseClientDirective(programNode) {
  for (const statement of programNode.body) {
    if (statement.type !== "ExpressionStatement") break;
    const expression = statement.expression;
    if (expression.type !== "Literal") break;
    if (
      typeof expression.raw === "string" &&
      USE_CLIENT_RE.test(expression.raw)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Answers "is this file a client module" for a rule, as the filename alone
 * before `Program` runs and as filename-or-directive after it. `Program` is
 * visited before any import node, so an import handler always sees the answer.
 */
export function clientModuleDetector(context) {
  let isClient = isClientFilename(filenameOf(context));

  return {
    isClientModule: () => isClient,
    Program(node) {
      if (hasUseClientDirective(node)) isClient = true;
    },
  };
}
