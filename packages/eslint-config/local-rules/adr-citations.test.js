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
  "no-client-domain-error-instanceof.js": ["0012"],
  "no-client-import-of-server-folder.js": ["0012"],
  "no-client-import-of-services.js": ["0011"],
  "no-cross-domain-deep-import.js": [],
  // The layer import table draws every boundary that is import-shaped, so it
  // cites the four ADRs its rows enforce: the barrel and the root buckets
  // (0010), the router, the buckets and the services folder (0011), the
  // transport error mapping (0012), the package entry points (0013).
  "no-cross-layer-import.js": ["0010", "0011", "0012", "0013"],
  "require-inngest-function-placement.js": ["0011"],
  "no-default-export.js": [],
  "no-feature-nesting.js": ["0010"],
  "no-raw-tailwind-colors.js": [],
  // The boundaries a mock may sit at are the public surfaces the architecture
  // draws: the domain barrel and the cross-cutting server folder (0010), the
  // services layer and the lib adapters (0011).
  "no-relative-test-mock.js": ["0010", "0011"],
  "require-schema-conventions.js": ["0011"],
  "require-server-action-suffix.js": [],
  "require-service-output-type.js": ["0011"],
  "require-use-client-suffix.js": ["0010"],
  "schema-must-be-pure-zod.js": ["0011"],
  "services-no-bare-error.js": ["0012"],
  "services-no-trpc-import.js": ["0011"],
  "services-read-never-writes.js": ["0011"],
  "services-verb-prefix.js": ["0011"],
};

// `0011` (server file conventions) and `0012` (domain errors) are pinned to
// their slugs so a later renumbering cannot point a citation at an unrelated
// ADR that took the slot.
const RESERVED = {
  "0011": "server-file-conventions",
  "0012": "domain-errors",
};

// The modules of this folder that are not rules, so the table below stays a
// list of rules. `imports.js` is the shared import helper: it cites no ADR of
// its own and is observed through the rules that consume it.
const NON_RULE_MODULES = ["imports.js", "index.js"];

// A retired rule leaves an empty `_deprecated_` stub behind for the maintainer
// to delete. It exports nothing and is wired nowhere, so it is not a rule.
const DEPRECATED_PREFIX = "_deprecated_";

function sourceFiles() {
  return readdirSync(localRulesDir).filter(
    (name) => name.endsWith(".js") && !name.endsWith(".test.js"),
  );
}

function ruleSourceFiles() {
  return sourceFiles().filter(
    (name) =>
      !NON_RULE_MODULES.includes(name) && !name.startsWith(DEPRECATED_PREFIX),
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

  // A new module is a rule until this list says otherwise, so a rule cannot
  // slip past the table by being mistaken for a helper.
  it("accounts for every module of the folder", () => {
    const helpers = sourceFiles().filter((name) =>
      NON_RULE_MODULES.includes(name),
    );

    expect(helpers.sort()).toEqual([...NON_RULE_MODULES].sort());
  });

  // A stub that still held a rule would be a second, unwired copy of it: the
  // next reader could not tell which one the plugin loads.
  it("leaves every deprecated stub empty of rule code", () => {
    const stubs = sourceFiles().filter((name) =>
      name.startsWith(DEPRECATED_PREFIX),
    );

    for (const name of stubs) {
      const source = readFileSync(join(localRulesDir, name), "utf8");
      expect([name, source]).toEqual([
        name,
        expect.not.stringContaining("export"),
      ]);
    }
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
