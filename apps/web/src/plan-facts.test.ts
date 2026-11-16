import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import { describe, expect, it } from "vitest";

// Plan facts (Free plan limits, prices, seat counts) are repeated across the
// marketing pages and drift from `PLAN_LIMITS` and `PLAN_PRICES` whenever a
// Plan changes. The public TSX pages interpolate them, so a literal there is
// the bug. MDX cannot import a constant, so the blog and the docs keep their
// literals and this test checks each known phrasing against the constants.
//
// The patterns are deliberately narrow: the comparison pages quote competitor
// prices and limits, and those are not ours to derive.

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const publicRoutesDir = path.join(sourceDir, "app/(public)");
const contentDirs = [
  path.join(sourceDir, "content/blog"),
  path.join(sourceDir, "content/docs"),
];

const free = PLAN_LIMITS[SubscriptionPlanName.Free];
const pro = PLAN_LIMITS[SubscriptionPlanName.Pro];
const freePrice = PLAN_PRICES[SubscriptionPlanName.Free];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const agencyPrice = PLAN_PRICES[SubscriptionPlanName.Agency];

type PlanFact = {
  readonly file: string;
  readonly line: number;
  readonly text: string;
};

function factAt(file: string, source: string, index: number, text: string) {
  const line = source.slice(0, index).split("\n").length;
  return { file, line, text: text.replace(/\s+/g, " ") };
}

const NUMBER = String.raw`(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)`;

// A competitor price that happens to equal one of ours, matched by what
// follows the amount.
const COMPETITOR_PRICES = ["$99/mo Growth"];

const LITERAL_RULES: readonly RegExp[] = [
  /\b\d+\s+feedback\s+items\b/g,
  new RegExp(
    String.raw`\$(?:${[proPrice, agencyPrice, proPrice * 12].join("|")})(?!\d|[.,]\d)`,
    "g",
  ),
  new RegExp(String.raw`\bup\s+to\s+${NUMBER}(?:\s+members\b|\))`, "g"),
];

// A project or member count is only the Free plan's when the sentence also
// names its feedback items.
const FREE_PLAN_COUNT = new RegExp(
  String.raw`\b${NUMBER}\s+(?:projects?|(?:team\s+)?members?)\b`,
  "g",
);

function sentenceAround(source: string, index: number) {
  const before = source.slice(0, index).search(/[.!?]\s[^.!?]*$/);
  const afterMatch = source.slice(index).search(/[.!?](\s|$)/);
  const start = before === -1 ? 0 : before;
  const end = afterMatch === -1 ? source.length : index + afterMatch;
  return source.slice(start, end);
}

/** Every Faster Fixes plan fact written as a literal in a TSX file. */
function literalPlanFactsIn(file: string, source: string): PlanFact[] {
  const literals = LITERAL_RULES.flatMap((rule) =>
    [...source.matchAll(rule)]
      .filter(
        (match) =>
          !COMPETITOR_PRICES.some((price) =>
            source.startsWith(price, match.index),
          ),
      )
      .map((match) => factAt(file, source, match.index, match[0])),
  );
  const freePlanCounts = [...source.matchAll(FREE_PLAN_COUNT)]
    .filter((match) =>
      /feedback\s+items/.test(sentenceAround(source, match.index)),
    )
    .map((match) => factAt(file, source, match.index, match[0]));

  return [...literals, ...freePlanCounts];
}

type MdxRule = {
  readonly pattern: RegExp;
  readonly expected: readonly number[];
};

// The phrasings the blog uses today, each capture paired with the value it
// states.
const MDX_RULES: readonly MdxRule[] = [
  {
    pattern: /\b(\d+) projects?, (\d+) feedback items, (\d+) members?\b/g,
    expected: [free.projects, free.feedbacks, free.seats],
  },
  { pattern: /\b(\d+) feedback items\b/g, expected: [free.feedbacks] },
  {
    pattern: /\b(\d+)-item cap on the free plan\b/g,
    expected: [free.feedbacks],
  },
  { pattern: /\bFree: \$(\d+)\/mo\b/g, expected: [freePrice] },
  {
    pattern:
      /\bPro: \$(\d+)\/mo, (\d+) projects, unlimited feedback, (\d+) members\b/g,
    expected: [proPrice, pro.projects, pro.seats],
  },
  {
    pattern: /\bAgency: \$(\d+)\/mo, unlimited projects\b/g,
    expected: [agencyPrice],
  },
  {
    pattern: /\bFaster Fixes Pro(?:<\/strong>)? at \$(\d+)\/mo\b/g,
    expected: [proPrice],
  },
  { pattern: /\bPro plan is \$(\d+)\/mo flat\b/g, expected: [proPrice] },
  {
    pattern: /\$(\d+)(?:\/mo)?[ -]per[ -](\d+)[ -]users\b/g,
    expected: [proPrice, pro.seats],
  },
  {
    pattern: /\bFrom \$(\d+) · \$(\d+) · \$(\d+)\/mo\b/g,
    expected: [freePrice, proPrice, agencyPrice],
  },
  {
    pattern: /^\| \*\*Faster Fixes\*\* \|[^|]*\|\s*Yes \((\d+) projects?\)/gm,
    expected: [free.projects],
  },
];

/** Every plan fact of an MDX file that contradicts the constants. */
function contradictedPlanFactsIn(file: string, source: string): PlanFact[] {
  return MDX_RULES.flatMap(({ pattern, expected }) =>
    [...source.matchAll(pattern)]
      .filter((match) =>
        expected.some((value, index) => Number(match[index + 1]) !== value),
      )
      .map((match) =>
        factAt(
          file,
          source,
          match.index,
          `${match[0]} (expected ${expected.join(", ")})`,
        ),
      ),
  );
}

function filesIn(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(entryPath, extension);
    return entry.name.endsWith(extension) ? [entryPath] : [];
  });
}

function relative(file: string) {
  return path.relative(sourceDir, file).replace(/\\/g, "/");
}

function named(facts: PlanFact[]) {
  return facts.map(({ file, line, text }) => `${file}:${line} "${text}"`);
}

describe("literalPlanFactsIn", () => {
  it("names a literal feedback limit", () => {
    const found = literalPlanFactsIn(
      "page.tsx",
      ["// Free plan", `"Up to 20 feedback items."`].join("\n"),
    );

    expect(found).toContainEqual({
      file: "page.tsx",
      line: 2,
      text: "20 feedback items",
    });
  });

  it("names our prices and the Pro seat count", () => {
    const found = literalPlanFactsIn(
      "page.tsx",
      `"Pro is $${proPrice}/month for up to ${pro.seats} members, Agency is $${agencyPrice} a month, $${proPrice * 12}/year."`,
    );

    expect(found.map(({ text }) => text)).toEqual([
      `$${proPrice}`,
      `$${agencyPrice}`,
      `$${proPrice * 12}`,
      `up to ${pro.seats} members`,
    ]);
  });

  it("names a Free plan count written beside its feedback items", () => {
    const found = literalPlanFactsIn(
      "page.tsx",
      "`The Free plan includes one project, ${limit} feedback\n items, and 1 member.`",
    );

    expect(found.map(({ text }) => text)).toEqual(["one project", "1 member"]);
  });

  it("accepts interpolations and competitor figures", () => {
    const found = literalPlanFactsIn(
      "page.tsx",
      [
        "`Pro is $${PLAN_PRICES.pro}/month for up to ${pro.seats} members.`",
        `"BugHerd is $50/month for 5 members. Atarim is up to 100 seats."`,
        `"Usersnap is $209/mo. Gleap is $99/mo Growth (4 seats)."`,
        `"The Atarim free plan covers 1 project and 200 AI credits."`,
        `"Import up to 100 items per call."`,
      ].join("\n"),
    );

    expect(found).toEqual([]);
  });
});

describe("contradictedPlanFactsIn", () => {
  it("names a Free plan statement that disagrees with PLAN_LIMITS", () => {
    const found = contradictedPlanFactsIn(
      "blog/post.mdx",
      [
        "# Post",
        "",
        "A free plan (1 project, 50 feedback items, 1 member).",
      ].join("\n"),
    );

    expect(found.map(({ file, line }) => `${file}:${line}`)).toEqual([
      "blog/post.mdx:3",
      "blog/post.mdx:3",
    ]);
  });

  it("names a price that disagrees with PLAN_PRICES", () => {
    const found = contradictedPlanFactsIn(
      "blog/post.mdx",
      "- Pro: $25/mo, 5 projects, unlimited feedback, 5 members",
    );

    expect(found).toHaveLength(1);
  });

  it("accepts statements that match the constants", () => {
    const found = contradictedPlanFactsIn(
      "blog/post.mdx",
      [
        `- Free: $${freePrice}/mo, ${free.projects} project, ${free.feedbacks} feedback items, ${free.seats} member`,
        `- Pro: $${proPrice}/mo, ${pro.projects} projects, unlimited feedback, ${pro.seats} members`,
        `- Agency: $${agencyPrice}/mo, unlimited projects, unlimited feedback`,
        `Faster Fixes Pro at $${proPrice}/mo flat, $${proPrice}/mo per ${pro.seats} users.`,
        "Userback Agency: $129/mo (15 members).",
      ].join("\n"),
    );

    expect(found).toEqual([]);
  });
});

describe("the public pages", () => {
  const files = filesIn(publicRoutesDir, ".tsx");

  // Without this, a scan that walked nothing would satisfy the assertion below.
  it("finds the pricing and comparison pages", () => {
    expect(files.map(relative)).toEqual(
      expect.arrayContaining([
        "app/(public)/pricing/page.tsx",
        "app/(public)/vs/bugherd/_features/bugherd-faq-section.tsx",
      ]),
    );
  });

  it("interpolate PLAN_LIMITS and PLAN_PRICES instead of literal plan facts", () => {
    const found = named(
      files.flatMap((file) =>
        literalPlanFactsIn(relative(file), readFileSync(file, "utf8")),
      ),
    );

    expect(
      found,
      `Literal Faster Fixes plan facts found. Interpolate PLAN_LIMITS or PLAN_PRICES from @/app/_domains/subscription instead:\n${found.join("\n")}`,
    ).toEqual([]);
  });
});

describe("the blog and the docs", () => {
  const files = contentDirs.flatMap((directory) => filesIn(directory, ".mdx"));

  it("finds the blog posts", () => {
    expect(files.map(relative)).toEqual(
      expect.arrayContaining(["content/blog/bugherd-alternatives.mdx"]),
    );
  });

  it("state the plan facts of PLAN_LIMITS and PLAN_PRICES", () => {
    const found = named(
      files.flatMap((file) =>
        contradictedPlanFactsIn(relative(file), readFileSync(file, "utf8")),
      ),
    );

    expect(
      found,
      `MDX plan facts that contradict PLAN_LIMITS or PLAN_PRICES. Update the copy to the constants:\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
