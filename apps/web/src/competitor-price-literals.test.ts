import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Competitor prices copied by hand into the marketing pages drifted apart:
// one page said Usersnap Growth was $159, another €129. The pages now read
// every competitor figure from `COMPETITOR_PRICES`, so a currency amount
// written as a literal in a public page is the bug. MDX cannot import a
// constant, so the blog keeps its literals and is not scanned.

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const publicRoutesDir = path.join(sourceDir, "app/(public)");
const registryFile = "app/(public)/_helpers/competitor-prices.ts";
// The registry and its formatters, whose docs show sample amounts.
const exemptFiles = [
  registryFile,
  "app/(public)/_helpers/format-competitor-price.ts",
];

// Amounts that are not a vendor's price: the self-hosted $0, the mock
// storefront the illustrations annotate, and hosting costs.
const ALLOWED_LITERALS: readonly RegExp[] = [
  /\$0(?!\d|[.,]\d)/g,
  /Pay \$49\b/g,
  /should read \$49\b/g,
  /\$5-20\/month\b/g,
];

const CURRENCY_LITERAL = /[$€]\d|\d\s?(?:€|EUR\b|USD\b)/g;

type PriceLiteral = {
  readonly file: string;
  readonly line: number;
  readonly text: string;
};

/** Every currency amount written as a literal in a page source. */
function priceLiteralsIn(file: string, source: string): PriceLiteral[] {
  const allowedRanges = ALLOWED_LITERALS.flatMap((allowed) =>
    [...source.matchAll(allowed)].map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
    })),
  );
  return [...source.matchAll(CURRENCY_LITERAL)]
    .filter(
      (match) =>
        !allowedRanges.some(
          ({ start, end }) => match.index >= start && match.index < end,
        ),
    )
    .map((match) => ({
      file,
      line: source.slice(0, match.index).split("\n").length,
      text: source.slice(match.index, match.index + 16).split("\n")[0] ?? "",
    }));
}

function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(entryPath);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [entryPath]
      : [];
  });
}

function relative(file: string) {
  return path.relative(sourceDir, file).replace(/\\/g, "/");
}

describe("priceLiteralsIn", () => {
  it("names a dollar or euro amount written as a literal", () => {
    const found = priceLiteralsIn(
      "page.tsx",
      ["// Usersnap", `"Growth is €129/mo, Team $149."`, `"49 EUR"`].join("\n"),
    );

    expect(found.map(({ line, text }) => `${line}:${text}`)).toEqual([
      "2:€129/mo, Team $1",
      '2:$149."',
      '3:9 EUR"',
    ]);
  });

  it("accepts interpolations, the self-hosted $0 and the mock storefront", () => {
    const found = priceLiteralsIn(
      "page.tsx",
      [
        "`Growth is ${formatPublishedPrice(growth, '/mo')}.`",
        "`Pro is $${proPrice}/mo, or $0 self-hosted.`",
        `<span className="text-[10px]">Pay $49</span>`,
        `"Price should read $49"`,
        `"typically $5-20/month on Railway"`,
      ].join("\n"),
    );

    expect(found).toEqual([]);
  });
});

describe("the public pages", () => {
  const files = filesIn(publicRoutesDir);

  // Without this, a scan that walked nothing would satisfy the assertion below.
  it("finds the comparison pages and the registry", () => {
    expect(files.map(relative)).toEqual(
      expect.arrayContaining([
        registryFile,
        "app/(public)/vs/usersnap/_features/usersnap-pricing-section.tsx",
        "app/(public)/open-source/_features/team-size-pricing-section.tsx",
      ]),
    );
  });

  it("read competitor prices from COMPETITOR_PRICES instead of literals", () => {
    const found = files
      .filter((file) => !exemptFiles.includes(relative(file)))
      .flatMap((file) =>
        priceLiteralsIn(relative(file), readFileSync(file, "utf8")),
      )
      .map(({ file, line, text }) => `${file}:${line} "${text}"`);

    expect(
      found,
      `Literal prices found in public pages. Read them from COMPETITOR_PRICES in app/(public)/_helpers/competitor-prices.ts and format them with format-competitor-price.ts:\n${found.join("\n")}`,
    ).toEqual([]);
  });
});
