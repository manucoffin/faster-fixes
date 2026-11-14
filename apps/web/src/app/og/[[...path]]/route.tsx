import { OG_IMAGE_SIZE } from "@/app/_constants/seo";
import { blogSource } from "@/lib/blog/source";
import { source as docsSource } from "@/lib/docs/source";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import { OgCard } from "../_components/og-card";
import { OG_CARDS, type OgCardContent } from "../_helpers/og-cards";

// Node runtime, not edge: Fumadocs' sources pull in node:path/fs to resolve
// MDX files from disk, which the edge runtime rejects.
export const runtime = "nodejs";

// Module-scoped: read once per cold start, reused per request.
const fontPromise = readFile(
  fileURLToPath(new URL("../_fonts/space-grotesk-bold.ttf", import.meta.url)),
);

type Params = { path?: string[] };

function findOgCard(segments: string[]): OgCardContent | null {
  const staticCard = OG_CARDS[`/${segments.join("/")}`];
  if (staticCard) return staticCard;

  const [section, ...rest] = segments;
  if (section === "blog" && rest.length === 1) {
    const post = blogSource.getPage(rest);
    return post ? { eyebrow: "Blog", title: post.data.title } : null;
  }
  if (section === "docs") {
    const page = docsSource.getPage(rest);
    return page ? { eyebrow: "Docs", title: page.data.title } : null;
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { path = [] } = await params;
  const card = findOgCard(path);
  if (!card) return new Response("Not found", { status: 404 });

  const fontData = await fontPromise;

  return new ImageResponse(<OgCard {...card} />, {
    ...OG_IMAGE_SIZE,
    fonts: [
      {
        name: "Space Grotesk",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ],
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
