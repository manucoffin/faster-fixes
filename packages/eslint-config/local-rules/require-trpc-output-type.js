// INVERTED for the services-over-suffix convention (ADR-0011, server file
// conventions).
// The service's return type is the type source of truth, NOT inferProcedureOutput.
// So a read service (`_services/<read-verb>-*.ts`) must export a type alias derived
// from its own function, e.g. `export type GetUser = Awaited<ReturnType<typeof getUser>>;`
// (a bare `ReturnType<typeof getUser>` is also accepted). Consumers import that type
// instead of inferring it from the tRPC procedure.
//
// The rule name is kept for migration continuity; its meaning is now the inverse
// of the original `inferProcedureOutput` requirement.

const SERVICES_PATH_RE = /(^|\/)_services\//;
// Reads only: writes do not need a derived return-type export. The verb list is
// the closed read vocabulary of the server file conventions, `count-` included.
const READ_VERB_RE = /^(get|list|find|search|has|is|count)-/;
// Test files exercise services but are not services themselves.
const EXEMPT_BASENAME_RE =
  /(?:\.test\.tsx?$|\.spec\.tsx?$|\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_)/;

// Walks a type annotation looking for `ReturnType<typeof X>` (covers
// `Awaited<ReturnType<typeof X>>` and other wrappers).
function referencesReturnTypeOfTypeof(node) {
  if (!node || typeof node !== "object") return false;

  if (
    node.type === "TSTypeReference" &&
    node.typeName &&
    node.typeName.type === "Identifier" &&
    node.typeName.name === "ReturnType"
  ) {
    const typeArgs = node.typeArguments || node.typeParameters;
    const first = typeArgs && typeArgs.params && typeArgs.params[0];
    if (first && first.type === "TSTypeQuery") return true;
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (
          child &&
          typeof child.type === "string" &&
          referencesReturnTypeOfTypeof(child)
        ) {
          return true;
        }
      }
    } else if (value && typeof value.type === "string") {
      if (referencesReturnTypeOfTypeof(value)) return true;
    }
  }
  return false;
}

export const requireTrpcOutputTypeRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A read service in _services/ must export its return type (Awaited<ReturnType<typeof getX>>) as the type source of truth.",
    },
    schema: [],
    messages: {
      missing:
        "This read service must export a type alias derived from its own return type (e.g. `export type GetUser = Awaited<ReturnType<typeof getUser>>;`). The service return type is the source of truth, not `inferProcedureOutput`.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const basename = filename.split("/").pop() || "";
    if (EXEMPT_BASENAME_RE.test(basename)) return {};
    if (!READ_VERB_RE.test(basename)) return {};

    let hasReturnTypeExport = false;
    // A retired service keeps its filename as an empty `export {}` placeholder,
    // because agents may not delete files. It exports no function, so there is no
    // return type to derive and nothing for this rule to ask for. Without this
    // exemption such a stub needs an eslint-disable, which plain `pnpm lint` then
    // reports as unused because the rule is agent-gated: neither state passes both
    // required checks.
    let hasAnyExport = false;

    return {
      ExportNamedDeclaration(node) {
        if (node.declaration || node.specifiers.length > 0) hasAnyExport = true;

        if (
          node.declaration &&
          node.declaration.type === "TSTypeAliasDeclaration" &&
          referencesReturnTypeOfTypeof(node.declaration.typeAnnotation)
        ) {
          hasReturnTypeExport = true;
        }
      },
      ExportDefaultDeclaration() {
        hasAnyExport = true;
      },
      ExportAllDeclaration() {
        hasAnyExport = true;
      },
      "Program:exit"(node) {
        if (!hasAnyExport) return;

        if (!hasReturnTypeExport) {
          context.report({ node, messageId: "missing" });
        }
      },
    };
  },
};
