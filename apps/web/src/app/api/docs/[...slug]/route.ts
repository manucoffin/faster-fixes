import { source } from "@/lib/docs/source";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = join(
    process.cwd(),
    "src/content/docs",
    `${page.path}.mdx`,
  );

  try {
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
