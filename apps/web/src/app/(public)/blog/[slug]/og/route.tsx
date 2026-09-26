import { blogSource } from "@/lib/blog/source";
import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { fileURLToPath } from "node:url";
import { OgCard } from "./og-card";

// Node runtime, not edge: Fumadocs' blogSource pulls in node:path/fs to
// resolve MDX files from disk. The edge runtime rejects that import.
export const runtime = "nodejs";

// Module-scoped: read once per cold start, reused per request.
const fontPromise = readFile(
  fileURLToPath(new URL("./_fonts/space-grotesk-bold.ttf", import.meta.url)),
);

type Params = { slug: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const page = blogSource.getPage([slug]);
  if (!page) return new Response("Not found", { status: 404 });

  const fontData = await fontPromise;

  return new ImageResponse(<OgCard title={page.data.title} />, {
    width: 1200,
    height: 630,
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
