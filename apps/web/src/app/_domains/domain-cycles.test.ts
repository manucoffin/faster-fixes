import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// The cycle ban of ADR-0010 is hard: a domain may depend on another, but the
// dependency graph stays acyclic, so a low-level domain never ends up waiting
// on a high-level one.
//
// This is a test rather than a lint rule because a cycle is a property of the
// whole graph: ESLint sees one file at a time and has nowhere to hold the
// edges it collected from the previous one. The scan reads every module of the
// folder, test files included: a test that reaches into another domain is a
// real edge between the two.
//
// Two seams, so neither half can pass by construction. `domainImportsIn` is
// checked against written-out specifiers of every import form, and
// `findDomainCycles` against planted graphs; the tree is then run through both.

const domainsDir = path.dirname(fileURLToPath(import.meta.url));

type DomainGraph = ReadonlyMap<string, ReadonlySet<string>>;

const ALIAS_IMPORT = /^@\/app\/_domains\/([^/]+)/;
const RELATIVE_IMPORT = /^\.\.?\//;
const DOMAIN_IN_PATH = /\/_domains\/([^/]+)(\/|$)/;

// The three specifier positions: `import`/`export … from`, a bare side-effect
// import, and a dynamic `import()`.
const SPECIFIER_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
];

function posix(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function domainOf(filePath: string) {
  return posix(filePath).match(DOMAIN_IN_PATH)?.[1] ?? null;
}

/**
 * The domains one module depends on, whatever the specifier form. A relative
 * path is resolved before it is judged, so walking out of a domain by `../` is
 * an edge like any other.
 */
function domainImportsIn(filePath: string, source: string) {
  const from = domainOf(filePath);
  const targets = new Set<string>();

  for (const pattern of SPECIFIER_PATTERNS) {
    for (const [, specifier] of source.matchAll(pattern)) {
      const alias = specifier?.match(ALIAS_IMPORT)?.[1];
      const resolved =
        specifier && RELATIVE_IMPORT.test(specifier)
          ? domainOf(
              path.posix.resolve(
                path.posix.dirname(posix(filePath)),
                specifier,
              ),
            )
          : null;
      const target = alias ?? resolved;
      if (target && target !== from) targets.add(target);
    }
  }

  return targets;
}

function sourceFilesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesIn(entryPath);
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
}

function domainNames() {
  return readdirSync(domainsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function buildDomainGraph(): DomainGraph {
  const graph = new Map<string, Set<string>>();

  for (const domain of domainNames()) {
    const targets = new Set<string>();
    for (const file of sourceFilesIn(path.join(domainsDir, domain))) {
      for (const target of domainImportsIn(file, readFileSync(file, "utf8"))) {
        targets.add(target);
      }
    }
    graph.set(domain, targets);
  }

  return graph;
}

/** A cycle is named by its own domains, rotated so the same loop reads the same way twice. */
function canonical(cycle: readonly string[]) {
  const start = cycle.indexOf([...cycle].sort()[0]!);
  return [...cycle.slice(start), ...cycle.slice(0, start)];
}

function findDomainCycles(graph: DomainGraph): string[][] {
  const visiting: string[] = [];
  const onPath = new Set<string>();
  const settled = new Set<string>();
  const cycles = new Map<string, string[]>();

  function visit(domain: string) {
    if (settled.has(domain)) return;
    if (onPath.has(domain)) {
      const cycle = canonical(visiting.slice(visiting.indexOf(domain)));
      cycles.set(cycle.join(">"), cycle);
      return;
    }

    visiting.push(domain);
    onPath.add(domain);
    // A domain importing itself is not a cross-domain cycle.
    for (const target of graph.get(domain) ?? []) {
      if (target !== domain) visit(target);
    }
    visiting.pop();
    onPath.delete(domain);
    settled.add(domain);
  }

  for (const domain of [...graph.keys()].sort()) visit(domain);

  return [...cycles.values()];
}

function formatCycle(cycle: readonly string[]) {
  return [...cycle, cycle[0]].join(" -> ");
}

function graphOf(edges: Record<string, string[]>): DomainGraph {
  return new Map(
    Object.entries(edges).map(([domain, targets]) => [
      domain,
      new Set(targets),
    ]),
  );
}

describe("domainImportsIn", () => {
  const file = "/repo/src/app/_domains/integration/_services/create-issue.ts";

  it("reads a barrel import addressed by its alias", () => {
    const imports = domainImportsIn(
      file,
      `import { feedbackStatus } from "@/app/_domains/feedback";`,
    );

    expect([...imports]).toEqual(["feedback"]);
  });

  it("reads a deep alias import, a re-export and a dynamic import", () => {
    const imports = domainImportsIn(
      file,
      [
        `import { plan } from "@/app/_domains/subscription/_helpers/plan";`,
        `export { Role } from "@/app/_domains/organization";`,
        `const user = await import("@/app/_domains/user");`,
      ].join("\n"),
    );

    expect([...imports].sort()).toEqual([
      "organization",
      "subscription",
      "user",
    ]);
  });

  it("reads a relative specifier by where it lands", () => {
    const imports = domainImportsIn(
      file,
      `import { status } from "../../feedback/_types/feedback-status";`,
    );

    expect([...imports]).toEqual(["feedback"]);
  });

  it("ignores an import of the module's own domain and of anything outside the domains", () => {
    const imports = domainImportsIn(
      file,
      [
        `import { client } from "./jira-client";`,
        `import { prisma } from "@workspace/db";`,
        `import { auth } from "@/server/auth/config";`,
      ].join("\n"),
    );

    expect([...imports]).toEqual([]);
  });
});

describe("findDomainCycles", () => {
  it("names both domains of a two-domain cycle", () => {
    const cycles = findDomainCycles(
      graphOf({ feedback: ["integration"], integration: ["feedback"] }),
    );

    expect(cycles.map(formatCycle)).toEqual([
      "feedback -> integration -> feedback",
    ]);
  });

  it("names every domain of a longer cycle", () => {
    const cycles = findDomainCycles(
      graphOf({
        user: ["organization"],
        organization: ["subscription"],
        subscription: ["user"],
      }),
    );

    expect(cycles.map(formatCycle)).toEqual([
      "organization -> subscription -> user -> organization",
    ]);
  });

  it("reports nothing for a graph where two domains share a dependency", () => {
    const cycles = findDomainCycles(
      graphOf({
        feedback: ["user"],
        integration: ["feedback", "user"],
        user: [],
      }),
    );

    expect(cycles).toEqual([]);
  });

  it("reports nothing for a domain that imports itself", () => {
    expect(findDomainCycles(graphOf({ feedback: ["feedback"] }))).toEqual([]);
  });
});

describe("the domains folder of this app", () => {
  const graph = buildDomainGraph();

  it("holds one node per domain folder", () => {
    expect([...graph.keys()].sort()).toEqual(domainNames());
  });

  // Without this, an empty graph would satisfy the cycle assertion below: the
  // scan has to be reading the real specifiers of the tree for it to mean
  // anything. `integration` depends on `feedback` today.
  it("sees the cross-domain imports of the tree", () => {
    const edges = [...graph.values()].reduce(
      (total, targets) => total + targets.size,
      0,
    );

    expect(edges).toBeGreaterThan(0);
  });

  it("has no cycle between domains", () => {
    const cycles = findDomainCycles(graph).map(formatCycle);

    expect(cycles, `domain cycles: ${cycles.join(", ")}`).toEqual([]);
  });
});
