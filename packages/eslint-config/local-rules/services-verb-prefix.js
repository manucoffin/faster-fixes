// A file in `_services/` is named after its export: `<verb>-<entity>.ts`. The
// verb prefix declares read-vs-write (ADR-0011, server file conventions). This is the
// filename half of the convention only; the deeper "a read performs no writes"
// invariant is not cheaply AST-checkable and stays a review-time concern.
//
// We deliberately do NOT enumerate write verbs. The write set is OPEN
// (ADR-0011 prefers the most precise accurate verb), so an allowlist would
// grow without end and contradict its own decision. Instead this rule enforces
// the two halves that ARE stable:
//   1. shape       — the basename must start with a lowercase `<verb>-` prefix;
//   2. no synonyms — `modify-/edit-/save-/change-` are banned, a plain field
//                    write is `update-`.
// The closed read set (get/list/find/search/has/is/count) is documented in
// ADR-0011 and naming.md and remains a review-time concern.

const SERVICES_PATH_RE = /(^|\/)_services\//;

// The basename must open with a lowercase verb-ish token followed by a dash.
const VERB_PREFIX_SHAPE_RE = /^[a-z][a-z0-9]*-/;

// Banned `update` synonyms (ADR-0011 / naming.md): a plain field write is `update-`.
const BANNED_VERB_RE = /^(modify|edit|save|change)-/;

// Files in _services/ that are not verb-prefixed operations.
const EXEMPT_BASENAME_RE =
  /(?:\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_|\.test\.tsx?$|\.spec\.tsx?$)/;

export const servicesVerbPrefixRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A file in _services/ must be named `<verb>-<entity>` with a read verb (get-/list-/find-/search-/has-/is-/count-) or the most precise accurate write verb; `update` synonyms (modify-/edit-/save-/change-) are banned.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingVerbPrefix:
        "`{{ basename }}` is in `_services/` but is not named `<verb>-<entity>`. Name it after its export with a verb prefix: a read verb (get-/list-/find-/search-/has-/is-/count-) or the most precise accurate write verb.",
      bannedSynonym:
        "`{{ basename }}` uses a banned `update` synonym. A plain field write is `update-…`; `modify-/edit-/save-/change-` are not allowed.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    const basename = filename.split("/").pop() || "";
    if (EXEMPT_BASENAME_RE.test(basename)) return {};

    const messageId = BANNED_VERB_RE.test(basename)
      ? "bannedSynonym"
      : VERB_PREFIX_SHAPE_RE.test(basename)
        ? null
        : "missingVerbPrefix";
    if (!messageId) return {};

    return {
      Program(node) {
        context.report({ node, messageId, data: { basename } });
      },
    };
  },
};
