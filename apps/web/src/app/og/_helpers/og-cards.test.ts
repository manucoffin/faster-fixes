import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { OG_CARDS } from "./og-cards";

const PUBLIC_ROUTES = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../(public)",
);

// Route paths of the public pages with no dynamic segment: docs pages and
// blog posts take their card from frontmatter instead.
function listStaticPublicPaths() {
  return readdirSync(PUBLIC_ROUTES, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(`${sep}page.tsx`) || file === "page.tsx")
    .map((file) => relative(".", dirname(file)).split(sep))
    .filter((segments) => !segments.some((segment) => segment.includes("[")))
    .map((segments) => {
      const urlSegments = segments.filter(
        (segment) => segment !== "." && !segment.startsWith("("),
      );
      return `/${urlSegments.join("/")}`;
    });
}

describe("OG_CARDS", () => {
  it("finds the static public pages", () => {
    expect(listStaticPublicPaths()).toEqual(
      expect.arrayContaining(["/", "/pricing", "/vs/bugherd"]),
    );
  });

  it("has a card for every static public page", () => {
    const missing = listStaticPublicPaths().filter((path) => !OG_CARDS[path]);
    expect(missing).toEqual([]);
  });

  // The card wraps words, so punctuation right after the frame would be
  // pushed onto its own word.
  it("frames whole words of its title", () => {
    const broken = Object.entries(OG_CARDS)
      .filter(([, { title, highlight }]) => {
        if (!highlight) return false;
        const index = title.indexOf(highlight);
        const next = title[index + highlight.length];
        return index === -1 || (next !== undefined && next !== " ");
      })
      .map(([path]) => path);
    expect(broken).toEqual([]);
  });

  it("keeps at most three tags so the footer fits", () => {
    const crowded = Object.entries(OG_CARDS)
      .filter(([, card]) => (card.tags?.length ?? 0) > 3)
      .map(([path]) => path);
    expect(crowded).toEqual([]);
  });
});
