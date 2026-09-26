// The layer import table: one rule, driven by rows the shared config declares,
// rather than several blocks of the core restricted-imports rule. Flat config
// replaces rather than merges two blocks of the same core rule matching one
// file, so a second restriction written that way silently deletes the first;
// a table inside one rule cannot lose a row that way.
//
// A row is "files matching this path pattern may not import specifiers
// matching these patterns", plus the message that names the fix and an
// allowlist of sanctioned specifiers. Rows are read in order and the first one
// that matches a specifier reports it, so the most specific row owns the
// message a reader gets.
//
// Paths and specifiers are matched with regular expressions rather than globs:
// every other rule of this package matches paths that way, and a glob matcher
// is not reachable from inside a rule without a new dependency.
//
// `runtimeOnly` marks the rows that are about what reaches a runtime: a
// declaration-level or all-inline type import is erased by TypeScript, so it
// does not cross the layer. A row without it judges an import by where it
// points, whatever its kind.
//
// The rows the shared config carries today fall into two halves. Six scope
// themselves to one bucket and say what that bucket is for: a domain barrel
// exposes capabilities and not server implementations (ADR-0010), a tRPC
// router is thin transport over services, a helper is pure, a service is
// transport-agnostic (ADR-0011), the root buckets are domain-agnostic
// (ADR-0010) and the infrastructure folders are imported by the app tree
// rather than importing it. Three watch the whole source tree for a specifier
// that belongs to one layer only: `TRPCError` is transport and a service
// throws a `DomainError` (ADR-0012), database access lives in `_services/` or
// the server folder (ADR-0011), and the database package is reached through
// its public entry points (ADR-0013).
//
// This is a boundary rule: it is on the not-disableable list, so a row is
// lifted by a named allowlist entry in the shared config, in front of a
// reviewer, not by a comment inside the module the row guards.

import { filenameOf, importVisitors, matchesSpecifier } from "./imports.js";

function compileRow(row) {
  return {
    sourcePath: new RegExp(row.sourcePathPattern),
    exemptPaths: (row.exemptPathPatterns ?? []).map(
      (pattern) => new RegExp(pattern),
    ),
    forbidden: row.forbiddenPatterns.map((pattern) => new RegExp(pattern)),
    allowed: (row.allowImportPatterns ?? []).map(
      (pattern) => new RegExp(pattern),
    ),
    runtimeOnly: row.runtimeOnly === true,
    message: row.message,
  };
}

export const noCrossLayerImportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Layer import table: a file matching a row's source pattern may not import the specifiers that row forbids. One rule rather than several blocks of the core restricted-imports rule, so that one restriction cannot silently replace another.",
    },
    schema: [
      {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                sourcePathPattern: { type: "string" },
                exemptPathPatterns: {
                  type: "array",
                  items: { type: "string" },
                },
                forbiddenPatterns: { type: "array", items: { type: "string" } },
                allowImportPatterns: {
                  type: "array",
                  items: { type: "string" },
                },
                runtimeOnly: { type: "boolean" },
                message: { type: "string" },
              },
              required: [
                "name",
                "sourcePathPattern",
                "forbiddenPatterns",
                "message",
              ],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      // The row writes the whole sentence: the fix depends on the boundary
      // crossed, and a generic "forbidden import" tells an agent nothing.
      forbiddenLayerImport: "{{message}} Offending import: `{{source}}`.",
    },
  },
  create(context) {
    const filename = filenameOf(context);
    const [{ rows = [] } = {}] = context.options;

    const applicable = rows
      .map(compileRow)
      .filter(
        (row) =>
          row.sourcePath.test(filename) &&
          !row.exemptPaths.some((pattern) => pattern.test(filename)),
      );

    if (applicable.length === 0) return {};

    return importVisitors(context, (reference) => {
      for (const row of applicable) {
        if (row.runtimeOnly && reference.kind === "type") continue;
        if (
          !row.forbidden.some((pattern) => matchesSpecifier(reference, pattern))
        ) {
          continue;
        }
        // An allowance lifts its own row and no other: it was written for
        // the boundary that row draws, so a later row still judges the same
        // specifier on its own terms.
        if (
          row.allowed.some((pattern) => matchesSpecifier(reference, pattern))
        ) {
          continue;
        }
        context.report({
          node: reference.node,
          messageId: "forbiddenLayerImport",
          data: { message: row.message, source: reference.source },
        });
        return;
      }
    });
  },
};
