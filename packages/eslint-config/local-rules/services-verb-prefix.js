// A file in `_services/` is named after its export: `<verb>-<entity>.ts`. The
// verb prefix declares read-vs-write (ADR-0011, server file conventions), and
// the file name declares the export, so neither can drift from the other.
//
// The rule checks four things:
//   1. the verb        — the first word of the basename is a read verb (closed
//                        set) or a write verb (open set, a rule option). A noun
//                        is not a verb, so `plan.ts` is reported;
//   2. the banned ones — `update` synonyms (`modify-/edit-/save-/change-`), the
//                        process verbs a computed read may not use, and the
//                        `get-all-` / `get-paginated-` prefixes a single
//                        `list-` entrypoint replaces;
//   3. the exemptions  — a module that is not an operation (an SDK client, an
//                        error class, a cipher, a cookie) keeps its noun name,
//                        recognised by a suffix from the option list;
//   4. the export      — in a non-exempt file, an exported function is named
//                        after the basename.
//
// The read set is closed because "a verb outside the read set means a possible
// write" is the signal the whole convention rests on. The write set is open, so
// it is an option rather than a constant: coining a domain verb is a one-line,
// reviewed change to the shared config, and the report says so.
//
// The export name is compared case-insensitively. A kebab basename cannot carry
// the house spelling of a proper noun, so `get-github-installation.ts` exports
// `getGitHubInstallation`, and the check is about the words and their order,
// not about where the capitals fall.
//
// The deeper "a read performs no writes" invariant is a separate rule that
// reads the same closed read set from the shared config.

const SERVICES_PATH_RE = /(^|\/)_services\//;

// Reads never write, so this set may not be extended (ADR-0011, backend.md).
// Exported because the read-never-writes rule holds the same verbs to the
// promise they make: one list, two rules.
export const SERVICE_READ_VERBS = [
  "count",
  "find",
  "get",
  "has",
  "is",
  "list",
  "search",
];

// The verbs the tree uses today. A new one is added here through the shared
// config, which is what makes coining a domain verb a reviewed decision.
const DEFAULT_WRITE_VERBS = [
  "accept",
  "add",
  "complete",
  "create",
  "delete",
  "disconnect",
  "handle",
  "impersonate",
  "leave",
  "link",
  "notify",
  "refresh",
  "regenerate",
  "register",
  "reject",
  "request",
  "require",
  "reset",
  "restore",
  "revoke",
  "select",
  "send",
  "sign",
  "stop",
  "sync",
  "toggle",
  "unlink",
  "update",
  "upgrade",
  "upsert",
];

// A `_services/` module that is not an operation: an SDK client factory, a
// named error class, a token cipher, a cookie reader. Naming one `get-…` would
// lie about what it is, so the noun name stands and the suffix says why.
const DEFAULT_EXEMPT_SUFFIXES = [
  "access",
  "app",
  "client",
  "cookie",
  "crypto",
  "error",
  "errors",
  "registration",
];

// A plain field write is `update-`.
const BANNED_SYNONYMS = ["change", "edit", "modify", "save"];

// A computed read is still a read: `get-` plus the result noun (naming.md).
const PROCESS_VERBS = ["compute", "evaluate", "preview", "resolve", "suggest"];

// One `list-` entrypoint takes filtering, pagination and sorting in an options
// object, so these two never become separate services.
const BANNED_PREFIXES = ["get-all-", "get-paginated-"];

// Files in `_services/` that are not verb-prefixed operations by kind rather
// than by name: the barrel, a schema, an Inngest job, a private helper, a test.
const EXEMPT_BASENAME_RE =
  /(?:\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_|\.test\.tsx?$|\.spec\.tsx?$)/;

const VERB_PREFIX_SHAPE_RE = /^([a-z][a-z0-9]*)-/;

function stripExtension(basename) {
  return basename.replace(/\.tsx?$/, "");
}

function camelCaseOf(basename) {
  return stripExtension(basename).replace(/-([a-z0-9])/g, (_, character) =>
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

export const servicesVerbPrefixRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A file in _services/ is named `<verb>-<entity>` with a read verb (closed set) or a write verb (open set, a rule option), and exports a function named after the file.",
    },
    schema: [
      {
        type: "object",
        properties: {
          readVerbs: { type: "array", items: { type: "string" } },
          writeVerbs: { type: "array", items: { type: "string" } },
          exemptSuffixes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingVerbPrefix:
        "`{{ basename }}` is in `_services/` but is not named `<verb>-<entity>`. Name it after its export with a verb prefix: a read verb ({{ readVerbs }}) if it performs no write, or a write verb.",
      unknownVerb:
        "`{{ verb }}-` is not a known service verb, so `{{ basename }}` does not say whether it reads or writes. Use a read verb ({{ readVerbs }}) if it performs no write, or one of the write verbs ({{ writeVerbs }}). A legitimate new write verb is one line: add it to `serviceVerbOptions.writeVerbs` in `packages/eslint-config/next.js`.",
      bannedSynonym:
        "`{{ basename }}` uses a banned `update` synonym. A plain field write is `update-…`; `modify-/edit-/save-/change-` are not allowed.",
      processVerb:
        "`{{ basename }}` uses the process verb `{{ verb }}-`. A computed read is still a read: name it `get-` plus the result noun it returns.",
      bannedPrefix:
        "`{{ basename }}` starts with `{{ prefix }}`. One `list-` entrypoint per shape takes filtering, pagination and sorting in an options object.",
      exportNameMismatch:
        "`{{ exported }}` is exported from `{{ basename }}`, which is named after a different function. A service file is plain-named after its export: rename the function to `{{ expected }}`, or move it to its own file or to `_helpers/`.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const basename = filename.split("/").pop() || "";
    if (EXEMPT_BASENAME_RE.test(basename)) return {};

    const options = context.options[0] || {};
    const readVerbs = options.readVerbs || SERVICE_READ_VERBS;
    const writeVerbs = options.writeVerbs || DEFAULT_WRITE_VERBS;
    const exemptSuffixes = options.exemptSuffixes || DEFAULT_EXEMPT_SUFFIXES;

    const stem = stripExtension(basename);
    if (exemptSuffixes.some((suffix) => stem.endsWith(`-${suffix}`))) return {};

    const readVerbList = readVerbs.map((verb) => `${verb}-`).join(", ");
    const nameReport = fileNameReport();

    if (nameReport) {
      return {
        Program(node) {
          context.report({ node, ...nameReport });
        },
      };
    }

    // The export check only runs once the file name is itself legal: when it is
    // not, the rename is the fix and a second report about the export would
    // point at the same edit.
    const expected = camelCaseOf(basename);
    const functionNames = new Set();

    function reportName(node, exported) {
      if (exported.toLowerCase() === expected.toLowerCase()) return;
      context.report({
        node,
        messageId: "exportNameMismatch",
        data: { exported, basename, expected },
      });
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) functionNames.add(node.id.name);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && isFunctionValued(node.init)) {
          functionNames.add(node.id.name);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.declaration?.type === "FunctionDeclaration") {
          if (node.declaration.id) {
            reportName(node.declaration.id, node.declaration.id.name);
          }
          return;
        }

        if (node.declaration?.type === "VariableDeclaration") {
          for (const declarator of node.declaration.declarations) {
            if (
              declarator.id.type === "Identifier" &&
              isFunctionValued(declarator.init)
            ) {
              reportName(declarator.id, declarator.id.name);
            }
          }
          return;
        }

        // `export { getUser }`: only the local names this file declares as
        // functions are checked, so a re-export of a type or of another
        // module's value is left alone.
        if (node.declaration || node.source || node.exportKind === "type") {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.exportKind === "type") continue;
          if (functionNames.has(specifier.local.name)) {
            reportName(specifier, specifier.local.name);
          }
        }
      },
    };

    function fileNameReport() {
      const bannedPrefix = BANNED_PREFIXES.find((prefix) =>
        stem.startsWith(prefix),
      );
      if (bannedPrefix) {
        return {
          messageId: "bannedPrefix",
          data: { basename, prefix: bannedPrefix },
        };
      }

      const match = VERB_PREFIX_SHAPE_RE.exec(stem);
      if (!match) {
        return {
          messageId: "missingVerbPrefix",
          data: { basename, readVerbs: readVerbList },
        };
      }

      const verb = match[1];
      if (BANNED_SYNONYMS.includes(verb)) {
        return { messageId: "bannedSynonym", data: { basename } };
      }
      if (PROCESS_VERBS.includes(verb)) {
        return { messageId: "processVerb", data: { basename, verb } };
      }
      if (readVerbs.includes(verb) || writeVerbs.includes(verb)) return null;

      return {
        messageId: "unknownVerb",
        data: {
          basename,
          verb,
          readVerbs: readVerbList,
          writeVerbs: writeVerbs.map((write) => `${write}-`).join(", "),
        },
      };
    }
  },
};
