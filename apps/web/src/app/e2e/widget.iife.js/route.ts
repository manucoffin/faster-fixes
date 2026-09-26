import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The build output of the workspace package, so the fixture needs no CDN.
const IIFE_FILE = join(
  process.cwd(),
  "node_modules/@fasterfixes/widget/dist/widget.iife.js",
);

export async function GET() {
  // A test fixture: `next build` sets NODE_ENV, so no deployment serves it.
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const script = await readFile(IIFE_FILE, "utf8");
  return new Response(script, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
