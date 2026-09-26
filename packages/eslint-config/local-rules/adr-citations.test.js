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
  // The shared error screen and its fixed copy are a frontend convention of the
  // coding standards; the leak it closes is argued in the message, not an ADR.
  "error-boundary-renders-error-screen.js": [],
  // A repo-wide naming convention of the coding standards: no ADR decides the
  // casing of a path, and its exceptions come from Next.js routing syntax.
  "kebab-case-path.js": [],
  "no-client-domain-error-instanceof.js": ["0012"],
  "no-client-import-of-server-folder.js": ["0012"],
  "no-client-import-of-services.js": ["0011"],
  // Domain encapsulation through the per-domain barrel is the decision of the
  // folder architecture ADR.
  "no-cross-domain-deep-import.js": ["0010"],
  // The layer import table draws every boundary that is import-shaped, so it
  // cites the four ADRs its rows enforce: the barrel and the root buckets
  // (0010), the router, the buckets and the services folder (0011), the
  // transport error mapping (0012), the package entry points (0013).
  "no-cross-layer-import.js": ["0010", "0011", "0012", "0013"],
  "require-inngest-function-placement.js": ["0011"],
  // A repo-wide naming convention of the coding standards, with no
  // architecture decision behind it: no ADR discusses default exports, and the
  // one exception the rule carries (the Next.js special files) comes from the
  // framework rather than from this repo.
  "no-default-export.js": [],
  // The em dash ban is a non-negotiable of the house style, recorded in
  // `CLAUDE.md` and the coding standards rather than in an architecture
  // decision, so there is nothing for it to cite.
  "no-em-dash-in-copy.js": [],
  "no-feature-nesting.js": ["0010"],
  // Two react-hook-form conventions of the frontend standards, grounded in how
  // the library subscribes and resets rather than in an architecture decision.
  "no-form-mutation-in-effect.js": [],
  "no-form-state-prop.js": [],
  // A design-system convention: the hue-to-token table is the theme in
  // `packages/ui/src/styles/globals.css`, not an ADR.
  "no-raw-tailwind-colors.js": [],
  // The boundaries a mock may sit at are the public surfaces the architecture
  // draws: the domain barrel and the cross-cutting server folder (0010), the
  // services layer and the lib adapters (0011).
  "no-relative-test-mock.js": ["0010", "0011"],
  // Three code-shape conventions of the coding standards, not architecture
  // decisions: the union type over the enum, the cast that checks nothing, and
  // the empty list standing in for a failed read. No ADR to cite, so the
  // messages name the alternative instead.
  "no-restricted-patterns.js": [],
  "require-schema-conventions.js": ["0011"],
  // ADR-0011 governs the `_services/` layer and the server folder, and says
  // nothing about server actions: the `*.server.action.ts` convention is a
  // coding standard, so the rule's messages carry the reasoning (a directive
  // mints a public endpoint) rather than a citation.
  "require-server-action-suffix.js": [],
  "require-service-output-type.js": ["0011"],
  "require-use-client-suffix.js": ["0010"],
  "schema-must-be-pure-zod.js": ["0011"],
  "services-no-bare-error.js": ["0012"],
  "services-no-trpc-import.js": ["0011"],
  "services-read-never-writes.js": ["0011"],
  "services-verb-prefix.js": ["0011"],
};

// `0011` (server file conventions), `0012` (domain errors) and `0015` (every
// convention rule is always on) are pinned to their slugs so a later
// renumbering cannot point a citation at an unrelated ADR that took the slot.
const RESERVED = {
  "0011": "server-file-conventions",
  "0012": "domain-errors",
  "0015": "every-convention-rule-is-always-on",
};

// ADR-0015 is the one decision no rule cites, and the table above says so by
// omission. It settles where every rule runs, not what any one of them checks,
// so the config and its test carry it: `next-config.test.js` asserts that each
// rule resolves to `error` with no environment variable set. A rule citing it
// would be claiming the decision as its own.
const CONFIG_ONLY_ADR = "0015";

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

function committedAdrs() {
  return new Map(
    readdirSync(adrDir)
      .map((name) => /^(\d{4})-(.+)\.md$/.exec(name))
      .filter((match) => match)
      .map((match) => [match[1], match[2]]),
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

  // The always-on decision belongs to the config, not to a rule, so the test
  // holds it from both sides: the ADR is committed under the slug reserved for
  // it, and no rule claims it.
  it("leaves ADR-0015 to the config rather than to a rule", () => {
    expect(committedAdrs().get(CONFIG_ONLY_ADR)).toBe(
      RESERVED[CONFIG_ONLY_ADR],
    );

    const claiming = Object.entries(EXPECTED_CITATIONS)
      .filter(([, numbers]) => numbers.includes(CONFIG_ONLY_ADR))
      .map(([name]) => name);

    expect(claiming).toEqual([]);
  });

  it("points every cited number at a committed or reserved ADR of this repo", () => {
    const committed = committedAdrs();

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
