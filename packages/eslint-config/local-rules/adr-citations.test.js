import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { servicesNoBareErrorRule } from "./services-no-bare-error.js";

const localRulesDir = dirname(fileURLToPath(import.meta.url));
const adrDir = join(localRulesDir, "..", "..", "..", "docs", "adr");

const ADR_CITATION_RE = /ADR-(\d{4})/g;

// The ADR each rule derives from, by this repo's numbering. These rules arrived
// from another project citing its numbers, where the folder architecture is
// ADR-0009; here it is ADR-0010 and ADR-0009 is the Diagnostic Trail, so a
// citation that merely points at an existing file is not enough. This table is
// the assertion: a rule may cite these numbers and no others.
const EXPECTED_CITATIONS = {
  "no-client-import-of-server-errors.js": ["0012"],
  "no-client-import-of-services.js": ["0011"],
  "no-cross-domain-deep-import.js": [],
  "no-default-export.js": [],
  "no-feature-nesting.js": ["0010"],
  "no-raw-tailwind-colors.js": [],
  "require-schema-conventions.js": [],
  "require-server-action-suffix.js": [],
  "require-trpc-output-type.js": ["0011"],
  "require-use-client-suffix.js": ["0010"],
  "schema-must-be-pure-zod.js": ["0011"],
  "services-no-bare-error.js": ["0012"],
  "services-no-trpc-import.js": ["0011"],
  "services-verb-prefix.js": ["0011"],
};

// `0011` (server file conventions) and `0012` (domain errors) are pinned to
// their slugs so a later renumbering cannot point a citation at an unrelated
// ADR that took the slot.
const RESERVED = {
  "0011": "server-file-conventions",
  "0012": "domain-errors",
};

function ruleSourceFiles() {
  return readdirSync(localRulesDir).filter(
    (name) =>
      name.endsWith(".js") && !name.endsWith(".test.js") && name !== "index.js",
  );
}

function citationsIn(source) {
  return [...new Set([...source.matchAll(ADR_CITATION_RE)].map(([, n]) => n))];
}

describe("ADR citations in the local rules", () => {
  it("covers every rule file", () => {
    expect(ruleSourceFiles().sort()).toEqual(
      Object.keys(EXPECTED_CITATIONS).sort(),
    );
  });

  it.each(Object.entries(EXPECTED_CITATIONS))(
    "%s cites exactly its own ADR",
    (name, expected) => {
      const source = readFileSync(join(localRulesDir, name), "utf8");
      expect(citationsIn(source).sort()).toEqual([...expected].sort());
    },
  );

  it("cites the domain errors ADR in the user-facing bare-error message", () => {
    expect(servicesNoBareErrorRule.meta.messages.bareError).toContain(
      "ADR-0012",
    );
  });

  it("points every cited number at a committed or reserved ADR of this repo", () => {
    const committed = new Map(
      readdirSync(adrDir)
        .map((name) => [/^(\d{4})-(.+)\.md$/.exec(name), name])
        .filter(([match]) => match)
        .map(([match]) => [match[1], match[2]]),
    );

    const cited = new Set(
      Object.values(EXPECTED_CITATIONS).flatMap((numbers) => numbers),
    );

    for (const number of cited) {
      const slug = committed.get(number);
      if (slug === undefined) {
        expect(
          RESERVED,
          `ADR-${number} is neither committed nor reserved`,
        ).toHaveProperty(number);
        continue;
      }
      // A reserved number that has since been committed must hold the ADR it
      // was reserved for, not an unrelated one that took the slot first.
      if (number in RESERVED) {
        expect(slug, `ADR-${number}`).toContain(RESERVED[number]);
      }
    }

    expect(committed.get("0010")).toBe("app-folder-architecture");
  });
});
