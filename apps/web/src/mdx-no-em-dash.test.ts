import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// The em dash ban is a non-negotiable of the house style. ESLint cannot parse
// MDX, so a lint rule over the source reaches none of the copy in the
// documentation, the blog and the legal pages: that is the one place where
// user-facing text would escape the ban. This test closes the gap by reading
// the files directly.
//
// It is a test rather than a script because tests already run in the pre-commit
// hook and in CI. The prior art is `packages/eslint-config/local-rules/adr-citations.test.js`
// and `src/app/_domains/domain-cycles.test.ts`, which read repository files the
// same way.
//
// Two seams, so neither half can pass by construction: `emDashesIn` is checked
// against planted content, `mdxFilesIn` against the tree, and the tree is then
// run through both.

const sourceDir = path.dirname(fileURLToPath(import.meta.url));

// Built from its code point rather than written out: the same ban applies to
// the app source, so a test of the rule should not be the one file that plants
// a literal em dash in it. A `\u2014` escape would not hold either, since
// Prettier rewrites it back to the character.
const EM_DASH = String.fromCodePoint(0x2014);
const EM_DASH_RE = new RegExp(EM_DASH, "g");

type EmDash = { readonly file: string; readonly line: number };

/**
 * Every em dash of a file, by line. The whole file is read, fenced code blocks
 * included: the copy inside a fence is read and copied by the reader too, and
 * the one em dash the docs had in a fence sat in a comment of an env template.
 */
function emDashesIn(file: string, source: string): EmDash[] {
  return source
    .split("\n")
    .flatMap((text, index) =>
      [...text.matchAll(EM_DASH_RE)].map(() => ({ file, line: index + 1 })),
    );
}

function mdxFilesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return mdxFilesIn(entryPath);
    return entry.name.endsWith(".mdx") ? [entryPath] : [];
  });
}

function relative(file: string) {
  return path.relative(sourceDir, file).replace(/\\/g, "/");
}

describe("emDashesIn", () => {
  it("names the line of an em dash in prose", () => {
    const found = emDashesIn(
      "docs/index.mdx",
      ["# Title", "", `Feedback is chaotic ${EM_DASH} and slow.`].join("\n"),
    );

    expect(found).toEqual([{ file: "docs/index.mdx", line: 3 }]);
  });

  it("names every em dash of a line", () => {
    const found = emDashesIn(
      "blog/post.mdx",
      `Free ${EM_DASH} 1 project ${EM_DASH} 50 items`,
    );

    expect(found.map(({ line }) => line)).toEqual([1, 1]);
  });

  it("reads inside a fenced code block", () => {
    const found = emDashesIn(
      "docs/self-hosting.mdx",
      ["```bash", `# Email ${EM_DASH} required.`, "```"].join("\n"),
    );

    expect(found).toEqual([{ file: "docs/self-hosting.mdx", line: 2 }]);
  });

  it("reports nothing for copy that uses a comma, a colon or a period", () => {
    const found = emDashesIn(
      "docs/index.mdx",
      [
        "Feedback is chaotic, and slow.",
        "It captures three things: the screenshot, the URL, the logs.",
        "Hyphens and en dashes (2026-05-24, pages 3–4) stay.",
      ].join("\n"),
    );

    expect(found).toEqual([]);
  });
});

describe("the MDX content of this app", () => {
  const files = mdxFilesIn(sourceDir);

  // Without this, a scan that walked nothing would satisfy the assertion below.
  it("finds the documentation, the blog and the legal pages", () => {
    const found = files.map(relative);

    expect(found).toEqual(
      expect.arrayContaining([
        "content/docs/index.mdx",
        "content/blog/bugherd-alternatives.mdx",
        "app/(public)/(legal)/privacy-policy/page.mdx",
      ]),
    );
  });

  it("has no em dash", () => {
    const found = files.flatMap((file) =>
      emDashesIn(relative(file), readFileSync(file, "utf8")),
    );
    const named = found.map(({ file, line }) => `${file}:${line}`);

    expect(named, `em dashes found: ${named.join(", ")}`).toEqual([]);
  });
});
