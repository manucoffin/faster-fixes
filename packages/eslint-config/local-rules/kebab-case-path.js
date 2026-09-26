// Every folder and file name is lowercase kebab-case, so a path reads the same
// way everywhere and an import never breaks on a case-insensitive file system
// that let `UserCard.tsx` and `user-card.tsx` coexist in a working copy. Dots
// separate the parts of a name (`create-user.schema.ts`, `foo.client.tsx`), and
// each part is kebab-case on its own.
//
// A few spellings are not names in that sense and pass as they are:
//   - a leading `_`, which marks a bucket or a private file (`_services`,
//     `_app.ts`); the rest of the name is still checked;
//   - a leading `.`, which marks a dotfile or a dot folder (`.storybook`);
//   - the Next.js route segments, whose brackets, parentheses and `@` are
//     routing syntax the framework reads (`[id]`, `[...slug]`, `(group)`,
//     `@slot`), and whose inner name is often a camelCase param;
//   - an intercepting prefix (`(.)`, `(..)`, `(...)`), after which the rest of
//     the segment is checked like any other;
//   - a `_deprecated_` stub, which only waits for a maintainer to delete it.
//
// Only the part of the path under the working directory is checked: the
// folders above it belong to whoever cloned the repo.

import path from "node:path";

import { filenameOf, normalizePath } from "./imports.js";

const DEPRECATED_PREFIX = "_deprecated_";
const IGNORED_SEGMENT = "node_modules";
const KEBAB_PART_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ROUTE_SEGMENT_RE = /^(\[{1,2}[^\]]+\]{1,2}|\([^.)][^)]*\)|@.+)$/;
const INTERCEPTING_PREFIX_RE = /^(\(\.{1,3}\))+/;

function isKebabName(name) {
  // An empty first part is the leading dot of a dotfile.
  const parts = name.split(".");
  return parts.every(
    (part, index) =>
      KEBAB_PART_RE.test(part) || (index === 0 && part === "" && name !== ""),
  );
}

function isAcceptedSegment(segment) {
  if (segment.startsWith(DEPRECATED_PREFIX)) return true;
  if (ROUTE_SEGMENT_RE.test(segment)) return true;

  const intercepted = segment.replace(INTERCEPTING_PREFIX_RE, "");
  if (intercepted !== segment) {
    return intercepted !== "" && isAcceptedSegment(intercepted);
  }

  const name = segment.startsWith("_") ? segment.slice(1) : segment;
  return isKebabName(name);
}

function toKebabPart(part) {
  return part
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function suggestionFor(segment) {
  const intercepting = INTERCEPTING_PREFIX_RE.exec(segment)?.[0] ?? "";
  const rest = segment.slice(intercepting.length);
  const prefix = rest.startsWith("_") ? "_" : "";
  const name = rest.slice(prefix.length);
  return intercepting + prefix + name.split(".").map(toKebabPart).join(".");
}

function segmentsUnderCwd(context) {
  const cwd = normalizePath(context.cwd);
  const relative = path.posix.relative(cwd, filenameOf(context));
  if (relative === "" || relative.startsWith("..")) return null;
  if (path.posix.isAbsolute(relative)) return null;
  return relative.split("/");
}

export const kebabCasePathRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Every folder and file name under the working directory is lowercase kebab-case, with dots between the parts of a name.",
    },
    schema: [],
    messages: {
      notKebabCase:
        'Rename "{{ segment }}" to "{{ suggestion }}". Folder and file names are lowercase kebab-case, with dots between the parts (`create-user.schema.ts`). A leading `_`, a Next.js route segment and a `_deprecated_` stub are the only exceptions.',
    },
  },
  create(context) {
    const segments = segmentsUnderCwd(context);
    if (segments === null) return {};
    if (segments.includes(IGNORED_SEGMENT)) return {};

    const offending = segments.find((segment) => !isAcceptedSegment(segment));
    if (offending === undefined) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "notKebabCase",
          data: { segment: offending, suggestion: suggestionFor(offending) },
        });
      },
    };
  },
};
