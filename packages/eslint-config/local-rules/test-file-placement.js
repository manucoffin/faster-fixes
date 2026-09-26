// Where a test file lives. Two halves:
//
//   1. A test sits next to the file it tests, same folder, same basename plus
//      `.test.ts(x)`: `token-cipher.test.ts` beside `token-cipher.ts`. The
//      subject is read from disk, so a test whose basename matches nothing is
//      reported: it was left behind by a rename, or it tests a behaviour spread
//      over several modules and should be named after the one it drives. A
//      structural check (a test that reads the tree rather than one module:
//      the domain cycle check, the MDX em dash scan, the `server-only` alias
//      pin) has no subject by design, so the config names each one in
//      `structuralCheckPathPatterns`, in front of a reviewer.
//   2. Inside `src/app/`, a test sits in the layers the test standard covers:
//      `_helpers/` (pure) and `_services/` (dependency-injected), plus a
//      contract route handler's `route.test.ts`. Those are the layers ADR-0011
//      puts the logic in; a router is thin transport over services, and a
//      feature or a component is UI the harness has no DOM tooling for.
//
// A `*.spec.ts(x)` name and a `__tests__/` folder are reported too: the
// harness only collects `*.test.ts(x)`, so a spec file never runs, and a
// separate test folder breaks the colocation above.

import { existsSync } from "node:fs";
import path from "node:path";

import { filenameOf } from "./imports.js";

const TEST_RE = /\.test\.tsx?$/;
const SPEC_RE = /\.spec\.tsx?$/;
const TESTS_FOLDER = "__tests__";
const SUBJECT_EXTENSIONS = [".ts", ".tsx"];

const APP_SEGMENT = "/src/app/";
const TESTABLE_BUCKETS = new Set(["_helpers", "_services"]);
const ROUTE_TEST_RE = /^route\.test\.tsx?$/;

function hasSubject(filename) {
  const stem = filename.replace(TEST_RE, "");
  return SUBJECT_EXTENSIONS.some((extension) => existsSync(stem + extension));
}

function isInTestableLayer(filename) {
  const appIndex = filename.lastIndexOf(APP_SEGMENT);
  if (appIndex === -1) return true;

  const dirs = filename.slice(appIndex + APP_SEGMENT.length).split("/");
  const basename = dirs.pop() || "";
  if (ROUTE_TEST_RE.test(basename)) return true;
  return dirs.some((dir) => TESTABLE_BUCKETS.has(dir));
}

export const testFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test sits next to the module it tests, under the same basename, and inside `src/app/` only in `_helpers/`, `_services/` or beside a route handler. Structural checks are named in the config.",
    },
    schema: [
      {
        type: "object",
        properties: {
          structuralCheckPathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      specName:
        "The harness collects `*.test.ts(x)` files only, so this file never runs. Rename it to `{{ suggested }}`.",
      testsFolder:
        "A test sits next to the file it tests, not in a `__tests__/` folder, so the pair moves and renames together. Move this file beside its subject.",
      missingSubject:
        "No `{{ subject }}.ts(x)` sits beside this test. A test is colocated with the module it tests and shares its basename, so the pair moves and renames together. Rename it after the module it drives, or, if it is a structural check that reads the tree, name it in `structuralCheckPathPatterns` of the shared config.",
      outsideTestableLayer:
        "Inside `src/app/`, a test covers a pure `_helpers/` function, a dependency-injected `_services/` function or a contract route handler. That is where ADR-0011 puts the logic: a router is thin transport, and a feature or a component is UI the harness has no DOM tooling for. Extract the logic this test needs into `_helpers/` or `_services/` and test it there.",
    },
  },
  create(context) {
    const filename = filenameOf(context);
    const basename = path.posix.basename(filename);
    const [{ structuralCheckPathPatterns = [] } = {}] = context.options;

    return {
      Program(node) {
        if (SPEC_RE.test(basename)) {
          context.report({
            node,
            messageId: "specName",
            data: { suggested: basename.replace(".spec.", ".test.") },
          });
          return;
        }
        if (filename.includes(`/${TESTS_FOLDER}/`)) {
          context.report({ node, messageId: "testsFolder" });
          return;
        }
        if (!TEST_RE.test(basename)) return;

        const isStructuralCheck = structuralCheckPathPatterns.some((pattern) =>
          new RegExp(pattern).test(filename),
        );
        if (isStructuralCheck) return;

        if (!hasSubject(filename)) {
          context.report({
            node,
            messageId: "missingSubject",
            data: { subject: basename.replace(TEST_RE, "") },
          });
        }

        if (!isInTestableLayer(filename)) {
          context.report({ node, messageId: "outsideTestableLayer" });
        }
      },
    };
  },
};
